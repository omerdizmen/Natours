const AppError = require("./../utils/appError");

const handleCastErrorDB = err => {
    const message = `Invalid ${err.path}; ${err.value}.`;
    return new AppError(message, 400);
}

const handleDuplicateFieldsDB = function(err){
    const value = err.errmsg.match(/(["'])(\\?.)*?\1/g);
    
    const message = `Duplicate field value: ${value}. Please use another`;
    return new AppError(message, 400);
}

const sendErrorDev = function(err, req, res){
    if(req.originalUrl.startsWith("/api")){
        res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack
        });
    }
    else{
        res.status(err.statusCode).render("error", {
            title: "Something went wrong",
            msg: err.message
        });
    }

}

const handleValidationErrorDB = function(err){
    const errors = Object.values(err.errors).map(el => el.message);

    const message = `Invalid input data. ${errors.join(". ")}`;
    return new AppError(message, 400);
}

const handleJWTError = function(){
    return new AppError("Invalid token. Please log in again", 401);
}

function handleJWTExpiredError(){
    return new AppError("Your session has expired please log in again", 401);
}

const sendErrorProduction = function(err, req, res) {
    if(err.isOperational){
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
        });
    }
    else{
        console.log("ERROR 💥", err );
        res.status(500).json({
            status: "error",
            message: "Something went very wrong!"
        });
    }

    // sendErrorDev(err, res);
}

module.exports = (err, req, res, next) => {
    
    err.statusCode = err.statusCode || 500;
    err.status = err.status || "error";

    if(process.env.NODE_ENV === "development"){
        sendErrorDev(err, req, res);
    }
    else if(process.env.NODE_ENV === "production"){
        let error = { ...err };

        if(err.name === "CastError"){
            error = handleCastErrorDB(error);
        }
        if(err.code === 11000){
            error = handleDuplicateFieldsDB(err);
        }

        if(err.name === "ValidationError") {
            error = handleValidationErrorDB(err);
        }

        if(err.name === "JsonWebTokenError"){
            error = handleJWTError();
        }
        if(err.name === "TokenExpiredError"){
            error = handleJWTExpiredError();
        }
        
        sendErrorProduction(error, req, res);
    }
}