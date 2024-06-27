const User = require("../models/userModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const factory = require("./handlerFactory");

const filterObj = function(obj, ...allowedFields){
    const newObj = {};
    Object.keys(obj).forEach(el => {
        if(allowedFields.includes(el)){
            newObj[el] = obj[el];
        }
    });

    return newObj;
}

exports.getAllUsers = catchAsync(async (req, res, next) =>{
    const users = await User.find();
    
    res.status(200).json({
        status: "success",
        requestedAt: req.requestTime,
        // results: users.length,
        data: {
            users
        }
    });
});

exports.updateMe = catchAsync( async function(req, res, next){
    if(req.body.password || req.body.passwordConfirm){
        return next(new AppError("this route is not for password updates. ", 400));
    }

    const filteredBody = filterObj(req.body, "name", "email");
    const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        status:"success",
        message:"ok",
        data:{
            user: updatedUser
        }
    });
});

exports.createUser = (req, res) =>{
    res.status(500).json({
        status:"error",
        message:"This route is not yet defined! Please use /signup instead"
    });
}

exports.deleteMe = catchAsync(async function(req, res, next){
    await User.findByIdAndUpdate(req.user.id, {active: false})

    res.status(204).json({
        status: "success",
        data: null
    });
});


exports.updateUser = (req, res) =>{
    res.status(500).json({
        status:"error",
        message:"This route is not yet defined"
    });
}

exports.getMe = (req, res, next) => {
    req.params.id = req.user.id;

    next();
}

exports.getUser = factory.getOne(User);
exports.deleteUser = factory.deleteOne(User);
exports.updateUser = factory.updateOne(User);