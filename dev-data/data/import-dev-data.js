const mongoose = require("mongoose");
const dotenv = require("dotenv");
// const server = require("./../../server");
const Tour = require("./../../models/tourModel")
const User = require("./../../models/userModel")
const Review = require("./../../models/reviewModel")
const fs = require("fs");

dotenv.config({path:`${__dirname}/../../.env`});

const DB = process.env.DATABASE.replace("<PASSWORD>", process.env.DATABASE_PASSWORD);

mongoose.connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
})
.then( () => {
    
    console.log("DB connection successful");
});

const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, "utf-8"));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, "utf-8"));
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, "utf-8"));

const importData = async () => {
    try{
        await Tour.create(tours, { validateBeforeSave: false });
        await User.create(users, { validateBeforeSave: false });
        await Review.create(reviews, { validateBeforeSave: false });
        console.log("data successfully loaded");
    }
    catch(err){
        console.log(err);
    }
    process.exit();
}

const deleteData = async () => {
    try{
        await Tour.deleteMany();
        await User.deleteMany();
        await Review.deleteMany();
    }
    catch(err){
        console.log(err);
    }
    process.exit();
}

if(process.argv[2] === "--import"){
    importData();
}
else if(process.argv[2] === "--delete"){
    deleteData();
}

console.log(process.argv);