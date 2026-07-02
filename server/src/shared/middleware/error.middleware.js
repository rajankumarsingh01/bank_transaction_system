const errorMiddleware = (err, req, res, next) => {

    console.error(err);

    const statusCode = err.statusCode || 500;

    return res.status(statusCode).json({
        success: false,
        message: err.message || "Internal Server Error",
        stack: process.env.NODE_ENV === "development"
            ? err.stack
            : undefined
    });

};

module.exports = errorMiddleware;