const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const Tour = require("./../models/tourModel");
const User = require("../models/userModel");


exports.getOverview = catchAsync( async (req, res, next) =>{
    const tours = await Tour.find();
    res.status(200).render("overview",{
        title: "All Tours",
        tours
    });
})

exports.getTour = catchAsync(async (req, res, next) =>{
    const tour = await Tour.findById(req.params.id)
    .populate({ path: "reviews", fields: "review rating user" });

    res.status(200).render("tour",{
        title: `${tour.name}`,
        tour
    });

    if(!tour){
        return next(new AppError("There is no tour with that name"));
    }
});

exports.login = catchAsync( async function(req, res, next){
    res.status(200).render("login",{
        title: "Login"
    });
});


exports.getAccount = catchAsync( async function(req, res, next){
    res.status(200).render("account",{
        title: "Your account"
    });
});

exports.updateUserData = catchAsync( async(req, res, next) => {
    const updatedUser = await User.findByIdAndUpdate(req.user.id, {
        name:req.body.name,
        email: req.body.email
    },
    {
        new: true,
        runValidators: true
    }
    );

    res.status(200).render("account",{
        title: "Your account",
        user: updatedUser
    });
});