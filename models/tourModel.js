const mongoose = require("mongoose");
const slugify = require("slugify");
const User = require("./userModel");

const tourSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'A tour must have a name'],
            unique: true,
            trim: true,
            maxlength: [80, 'A tour name must have less or equal then 80 characters'],
            minlength: [10, 'A tour name must have more or equal then 10 characters']
            // validate: [validator.isAlpha, 'Tour name must only contain characters']
        },
        slug: String,
        duration: {
            type: Number,
            required: [true, 'A tour must have a duration']
        },
        maxGroupSize: {
            type: Number,
            required: [true, 'A tour must have a group size']
        },
        difficulty: {
            type: String,
            required: [true, 'A tour must have a difficulty'],
            enum: {
            values: ['easy', 'medium', 'difficult'],
            message: 'Difficulty is either: easy, medium, difficult'
            }
        },
        ratingsAverage: {
            type: Number,
            default: 4.5,
            min: [1, 'Rating must be above 1.0'],
            max: [5, 'Rating must be below 5.0']
        },
        ratingsQuantity: {
            type: Number,
            default: 0
        },
        price: {
            type: Number,
            required: [true, 'A tour must have a price']
        },
        priceDiscount: {
            type: Number,
            validate: {
            validator: function(val) {
                // this only points to current doc on NEW document creation
                return val < this.price;
            },
            message: 'Discount price ({VALUE}) should be below regular price'
            }
        },
        summary: {
            type: String,
            trim: true,
            required: [true, 'A tour must have a description']
        },
        description: {
            type: String,
            trim: true
        },
        imageCover: {
            type: String,
            required: [true, 'A tour must have a cover image']
        },
        images: [String],
        createdAt: {
            type: Date,
            default: Date.now(),
            select: false
        },
        startDates: [Date],
        secretTour: {
            type: Boolean,
            default: false
        },
        startLocation: {
            // GeoJSON 
            type:{
                type:String,
                default: "Point",
                enum: ["Point"]
            },
            coordinates: [Number],
            address: String,
            description: String            
        },
        locations: [
          {
            type:{
              type:String,
              default: "Point",
              enum: ["Point"]
            },
            coordinates: [Number],
            address: String,
            description: String,
            day: Number
          }
            
        ],
        guides: [
            {
                type: mongoose.Schema.ObjectId,
                ref: "User"
            }
        ]
    },
    {
      toJSON: { virtuals: true },
      toObject: { virtuals: true }
    }
);

// tourSchema.index({price: 1});
tourSchema.index({price: 1, ratingsAverage: -1});
tourSchema.index({ startLocation: "2dsphere"});

tourSchema.virtual("durationsWeeks").get(function(){
    return this.duration / 7;
});

// DOCUMENT MIDDLEWARE: runs before .save() and .create() 

// tourSchema.pre("save", async function(next){
//     const guidesPromises = this.guides.map(async id => User.findById(id));
//     this.guides = await Promise.all(guidesPromises);

//     next();
// });

tourSchema.pre("save", function(next){
    this.slug = slugify(this.name, {lower: true });

    next();
});

// tourSchema.pre("save", function(next){
//     console.log("will save document...");
//     next();
// });

// tourSchema.post("save", function(doc, next){
//     console.log(doc);
//     next();
// });

// QUERY MIDDLEWARE

// virtual populate
tourSchema.virtual("reviews", {
    ref: "Review",
    foreignField: "tour",
    localField: "_id"
});

tourSchema.pre("find", function(next){
    this.find({ SecretTour:{$ne: true} });

    next();
});

tourSchema.pre(/^find/, function(next){
    this.populate({
        path: "guides",
        select: "-__v -passwordChangedAt"
    });
    
    next();
});

const Tour = mongoose.model("Tour", tourSchema);

module.exports = Tour;