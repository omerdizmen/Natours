const mongoose = require("mongoose");
const dotenv = require("dotenv");

process.on("uncaughtException", err => {
    console.log(err.name, err.message, err);
    console.log("UNCAUGHT EXCEPTION!! 💥");
    process.exit(1);    
})


dotenv.config({path:"./.env"});

const DB = process.env.DATABASE.replace("<PASSWORD>", process.env.DATABASE_PASSWORD);

mongoose.connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
})
.then( () => {
    
    console.log("DB connection successful");
})
// .catch(err => console.log("ERROR"));

const app = require("./app");
const port = process.env.PORT;
const server = app.listen(port, () => {
    console.log(`App running on port ${port}`);
});

// test

process.on("unhandledRejection", err => {
    console.log(err.name, err.message);
    console.log("unhandled rejection ! 💥");
    server.close(() => {
        process.exit(1);
    });
});
