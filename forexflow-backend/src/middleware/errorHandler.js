const errorHandler = (err, req, res, next) => {
    console.error(`[SERVER ERROR]: ${err.stack}`);

    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || "Internal Server Error",
        // Only show the stack trace in development mode
        stack: process.env.NODE_ENV === 'development' ? err.stack : {}
    });
};

module.exports = errorHandler;
