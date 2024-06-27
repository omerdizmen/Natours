const path = require("path");
const express = require("express");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const cookieParser = require("cookie-parser");

const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");

const tourRouter = require("./routes/tourRoutes");
const userRouter = require("./routes/userRoutes");
const reviewRouter = require("./routes/reviewRoutes");
const viewRouter = require("./routes/viewRoutes");

const app = express();
// app.use(helmet());
// app.use(helmet.contentSecurityPolicy());

if(process.env.NODE_ENV === "development"){
    app.use(morgan("dev"));
}

const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: "Too many requests from this IP, please try again in an hour!"
});

app.use("/api",limiter);

// data sanitization against nosql query inejection
app.use(mongoSanitize());

// data sanitization againts xss
app.use(xss());

//prevent paremeter pollution
app.use(hpp({
    whitelist: ["duration", "ratingsQuality", "ratingAverage", "maxGroupSize", "difficulty", "price"]
}));

app.use(express.json({ limit: "10kb"}));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true, limit: "10kb"}));
// app.use(express.static(`${__dirname}/public`));
app.use(express.static(path.join(__dirname, "public")));

// app.use((req, res, next) => {
    
//     next();
// });

app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    next();
});

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));


// app.get("/", (req, res) => {
//     // res.status(200).send("hello from the server side!");
//     res.status(200).json({
//         message: "hello from the server side!",
//         app:"Natours"
//     });
// });

// app.post("/", (req, res) => {
//     res.send("You can post to this endpoint...");
// });


// app.get("/api/v1/tours", getAllTours);
// app.post("/api/v1/tours", createTour);
// app.get("/api/v1/tours/:id", getTour);
// app.patch("/api/v1/tours/:id", updateTour);
// app.delete("/api/v1/tours/:id", deleteTour);

app.use("/", viewRouter);
app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/reviews", reviewRouter);

app.all("*", (req, res, next) => {
    // const err = new Error(`Cant't find ${req.originalUrl} on this server!`);
    // err.status = "fail";
    // err.statusCode = 404;

    next(new AppError(`Cant't find ${req.originalUrl} on this server! kabum'💥`, 404));
});

app.use(globalErrorHandler);

module.exports = app;