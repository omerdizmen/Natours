const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const APIFeatures = require("./../utils/apiFeatures");


exports.deleteOne = function(Model){
    return catchAsync( async function (req, res, next){   
        const document = await Model.findByIdAndDelete(req.params.id);
    
        if(!document){
            return next(new AppError("No document found with that ID"), 404);
        }
    
        res.status(204).json({
            status:"success",
            data: null
        });
    
    });
}

exports.updateOne = function(Model){
    return catchAsync(async function (req, res, next){
        const document = await Model.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators:true
        });

        if(!document){
            return next(new AppError("No document  found with that ID"), 404);
        }

        res.status(200).json({
            status:"success",
            data:{
                document
            }
        });
    });
}

exports.createOne = function(Model){
    return  catchAsync(async function(req, res, next) {   
        const document = await Model.create(req.body);
    
        res.status(201).json({
            status: "success",
            data:{
                data: document
            }
        });
    });
}

exports.getOne = function(Model, popOptions){
    return catchAsync(async function (req, res, next) {    
        let query =  Model.findById(req.params.id);

        if(popOptions){
            query = query.populate(popOptions);
        }

        const document = await query;
            
        if(!document){
            return next(new AppError("No document found with that ID"), 404);
        }
        
        res.status(200).json({
            status: "success",
            data:{
                document
            }
        });
    });
}

exports.getAll = function(Model){
    return catchAsync(async function(req, res, next){
        let filter = {}
        if(req.params.tourId) {
            filter = {tour: req.params.tourId}
        }    

        let features = new APIFeatures(Model.find(filter), req.query)
        .filter()
        .sort();
        features = features.limitFields();
        features = features.pagination();
        
        // const document = await features.query.explain();
        const document = await features.query;
        
        res.status(200).json({
            status: "success",
            requestedAt: req.requestTime,
            results: document.length,
            data: {
                data: document
            }
        });
    });
}