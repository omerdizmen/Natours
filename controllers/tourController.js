const factory = require("./handlerFactory");
const catchAsync = require("./../utils/catchAsync");
const Tour = require("./../models/tourModel");
const AppError = require("../utils/appError");

// const tours = JSON.parse(fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`));

// exports.checkID = (req, res, next, val) => {
//     console.log(`Tour id is ${val}`);
//     if(req.params.id * 1 > tours.length){
//         return res.status(404).json({
//             status: "fail",
//             message: "Invalid ID"
//         })
//     }

//     next();
// }

exports.aliasTopTours = function(req, res, next){
    req.query.limit = "5";
    req.query.sort = "-ratingsAverage,price";
    req.query.fields = "name,price,ratingsAverage,summary,difficulty";
    next();
}

exports.checkBody =  function(req, res, next){
    const body = req.body;

    if(!body.name || !body.price){
        return res.status(400).json({
            status:"bad request",
            message:"Missing name or price"
        });
    }

    next();
}

class APIFeatures{
    constructor(query, queryString){
        this.query = query;
        this.queryString = queryString;
    }

    filter(){
        const queryObj = {...this.queryString};
        const excludedFields = ["page","sort","limit","fields"];
        excludedFields.forEach(el => delete queryObj[el]);
        
        let queryString = JSON.stringify(queryObj);
        queryString = queryString.replace(/\b(gte|gt|lt|lte)\b/g, match =>`$${match}`);

        this.query = this.query.find(JSON.parse(queryString));
        
        return this;
    }

    sort(){
        if(this.queryString.sort){
            const sortBy = this.queryString.sort.split(",").join(" ");
            this.query = this.query.sort(sortBy);
        }
        else{
            this.query = this.query.sort("-createdAt");
        }

        return this;
    }

    limitFields(){
        if(this.queryString.fields){
            const fields = this.queryString.fields.split(",").join(" ");
            this.query = this.query.select(fields);
        }
        else{
            this.query = this.query.select("-__v");
        }

        return this;
    }

    pagination(){
        const page = this.queryString.page * 1 || 1;
        const limit = this.queryString.limit * 1 || 100;
        const skip = (page - 1) * limit;

        this.query = this.query.skip(skip).limit(limit);

        return this;
    }
}



exports.getAllTours = factory.getAll(Tour);
exports.createTour = factory.createOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.getTour = factory.getOne(Tour, {path: "reviews"});

exports.getTourStats = catchAsync( async (req, res) =>{
    const stats = await Tour.aggregate([
        {
            $match:{
                    ratingsAverage: {$gte: 4.5} 
        }
        },
        {
            $group:{
                _id:{$toUpper: "$difficulty"} ,
                toursCount:{$sum: 1},
                numRatings:{$sum:"$ratingsQuantity"},
                avgRating: {$avg: "$ratingsAverage"},
                avgPrice: {$avg:"$price"},
                minPrice: {$min:"$price"},
                maxPrice: {$max:"$price"}
            }
        },
        {
            $sort: {avgPrice: 1}
        },
        {
            $match: {_id:{$ne:"EASY"}}
        }
    ]);
    res.status(200).json({
        status:"success",
        data:{
            stats
        }
    });

})

exports.getMontlyPlan = catchAsync( async function(req, res){
    const year = req.params.year * 1;
    const plan = await Tour.aggregate([
        {
            $unwind: "$startDates"
        },
        {
            $match: {
                startDates:{
                    $gte: new Date(`${year}-01-01`), 
                    $lte: new Date(`${year}-12-31`)
                }
            }
        },
        {
            $group:{
                _id:{$month:"$startDates"},
                countTourStarts:{ $sum : 1},
                tours: {$push: "$name"}
            }
        },
        {
            $addFields: { month: "$_id" }
        },
        {
            $project: {
                _id: 0
            }
        },
        {
            $sort: {numTourStarts: -1}
        },
        {
            $limit: 12
        }
    ]);

    res.status(200).json({
        status:"success",
        length: plan.length,
        data:{
            plan
        }
    });
    
})

exports.getToursWithin = catchAsync ( async (req, res, next) =>{
    const {distance, latlng, unit } = req.params;
    const [lat, lng] = latlng.split(",");

    const radius = unit === "mi" ? distance / 3963.2 : distance / 6378.1;

    if(!lat || !lng){
        return next(new AppError("Please provide latitude and longitude int he format lat, lng."), 400);
    }

    const tours = await Tour.find({
        startLocation:{$geoWithin: {$centerSphere: [[lng, lat], radius]} }
    });

    res.status(200).json({
        status: "success",
        results: tours.length,
        data:{
            data:tours
        }
    });
});

exports.getDistances = catchAsync( async function(req, res, next){
    const {latlng, unit } = req.params;
    const [lat, lng] = latlng.split(",");

    const multiplier = unit === "mi" ? 0.000621371 : 0.001;

    if(!lat || !lng){
        return next(new AppError("Please provide latitude and longitude int he format lat, lng."), 400);
    }

    const distances = await Tour.aggregate([
        {
            $geoNear: {
                near: {
                    type: "Point",
                    coordinates: [lng * 1, lat * 1]
                },
                distanceField: "distance",
                distanceMultiplier: multiplier
            }
        },
        {
            $project:{
                distance: 1,
                name: 1
            }
        }
    ]);

    res.status(200).json({
        status: "success",
        data:{
            data:distances
        }
    });

});