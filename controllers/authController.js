const crypto = require("crypto");
const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const catchAsync = require("../utils/catchAsync");
const User = require("./../models/userModel");
const AppError = require("../utils/appError");
const sendEmail = require("../utils/email");


const signToken = id => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
}

const createSendToken = function(user, statusCode, res){
    const token = signToken(user._id);

    const cookieOptions =  {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
        secure: false,
        httpOnly: true,
    }

    if(process.env.NODE_ENV === "production"){
        cookieOptions.secure = true;
    }
    res.cookie("jwt", token, cookieOptions); 
    
    user.password = undefined;

    res.status(statusCode).json({
        status: "success",
        token,
        data: {
            user
        }
    });
}

exports.signup = catchAsync( async function(req, res, next){
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        passwordChangedAt: req.body.passwordChangedAt,
        role: req.body.role
    });

    createSendToken(newUser, 201, res);
});

exports.login = catchAsync( async function(req, res, next){
    const {email, password} = req.body;

    if(!email || !password){
        return next(new AppError("Please provide email and password!!", 400));
    }

    const user = await User.findOne({email}).select("+password");
    
    if(!user || !await user.correctPassword(password, user.password)){
        return next(new AppError("Incorrect email or password"), 401);
    }    

    createSendToken(user, 200, res);
    // const token =  signToken(user._id);

    // res.status(200).json({
    //     status: "success",
    //     token
    // });
});

exports.isLoggedIn = async function(req, res, next){
    if(req.cookies.jwt){
        try{
            const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);
            const freshUser = await User.findById(decoded.id);
            if(!freshUser){
                return next();
            }

            if(freshUser.changedPasswordAfter(decoded.iat)){
                return next();
            }
            
            res.locals.user = freshUser;
        }
        catch(err){
            return next();
        }
    }
    
    next();
}

exports.logout = (req, res) =>{
    // console.log(res.cookie());
    res.cookie("jwt", "loggedOut", {
        expires: new Date(Date.now() + 10 * 1000) ,
        httpOnly: true
    });

    res.status(200).json({status: "success"})
}

exports.protect = catchAsync(async function(req, res, next){
    let token;
    
    if(req.headers.authorization && (req.headers.authorization.startsWith("Bearer"))){
        token = req.headers.authorization.split(" ")[1];
    }
    else if(req.cookies.jwt){
        token = req.cookies.jwt;
    }

    if(!token){
        return next(new AppError("You are not logged in! Please login to get access.", 401));
    }

    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    
    const freshUser = await User.findById(decoded.id);
    if(!freshUser){
        return next(new AppError("The user belonging to this token does no longer exist", 401));
    }

    if(freshUser.changedPasswordAfter(decoded.iat)){
        return next(new AppError("User recently changed password! Please log in again"), 401);
    }

    req.user = freshUser;
    res.locals.user = freshUser;
    next();
});

exports.restrictTo = function(...roles){
    return function(req, res, next){
        if(!roles.includes(req.user.role)){
            return next(new AppError("You dont have a permission to perform this action", 401));
        }

        next();
    }
}

exports.forgotPassword = catchAsync(async function(req, res, next){
    const user = await User.findOne({email: req.body.email});

    if(!user){
        return next(new AppError("There is no user with that email address", 401));
    }

    const resetToken = user.createPasswordResetToken();

    await user.save({validateBeforeSave: false});

    const resetURL = `${req.protocol}://${req.get("host")}/api/v1/users/resetPassword/${resetToken}`;

    const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL} \n If you didn't forget your password, please ignore this message`;

    try{
        await sendEmail({
            email: "omerdizmen@gmail.com",
            subject: "Your password reset token (valid for 10 min)",
            message
        });

        res.status(200).json({
            status: "success",
            message: "Token set to email!"
        });
    }
    catch(err){
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({validateBeforeSave: false});

        return next(new AppError("There was an error sending the email, try again later!", 500));
    }
})

exports.resetPassword = catchAsync( async function(req, res, next){
    const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

    const user = await User.findOne({
        passwordResetToken: hashedToken,
         passwordResetExpires:{
            $gt: Date.now()
        }
    });

    if(!user){
        return next(new AppError("Token is expired or invalid", 400));
    }

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    createSendToken(user, 200, res);
})

// exports.updatePassword = catchAsync( async function(req, res, next){
//     const id = req.params._id;
//     const {currentPassword} = req.body;
//     const {newPassword} = req.body;
//     const {newPasswordConfirm} = req.body;

//     const user = await User.findById({ _id: id }).select("+password");

//     if(!user){
//         return next(new AppError("User could not find", 400));
//     }

//     if(!user.correctPassword(currentPassword, user.password)){
//         return next(new AppError("The password you provided does not match with the current password", 401));
//     }

//     user.password = newPassword;
//     user.passwordConfirm = newPasswordConfirm;

//     await user.save({ validateBeforeSave: true });


//     const token = signToken(user._id);

//     res.status(200).json({
//         status: "success",
//         token
//     });    
// });

exports.updatePassword = catchAsync( async function(req, res, next){    
    const user = await User.findById(req.user.id).select("+password");
    
    if(!(await user.correctPassword(req.body.currentPassword, user.password))){
        
        return next(new AppError("The password you provided does not match with the current password", 401));
    }

    user.password = req.body.newPassword;
    user.passwordConfirm = req.body.newPasswordConfirm;

    await user.save();

    createSendToken(user, 200, res); 
});