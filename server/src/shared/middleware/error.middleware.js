const logger = require("../logger/logger");

const errorMiddleware = (err, req, res, next) => {

    const statusCode = err.statusCode || 500;

    const logPayload = {
        requestId: req.id,
        statusCode,
        message: err.message,
        path: req.originalUrl,
        method: req.method
    };

    if (statusCode >= 500) {
        logger.error({ ...logPayload, stack: err.stack }, "Unhandled server error");
    } else {
        logger.warn(logPayload, "Request failed with client error");
    }

    return res.status(statusCode).json({
        success: false,
        message: err.message || "Internal Server Error",
        requestId: req.id,
        stack: process.env.NODE_ENV === "development"
            ? err.stack
            : undefined
    });

};

module.exports = errorMiddleware;