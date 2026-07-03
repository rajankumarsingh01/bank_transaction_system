const rateLimit = require("express-rate-limit");

const isTestEnv = process.env.NODE_ENV === "test";

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isTestEnv ? 10000 : 10,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => isTestEnv,
    message: {
        success: false,
        message: "Too many attempts, please try again after 15 minutes"
    }
});

const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isTestEnv ? 10000 : 100,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => isTestEnv,
    message: {
        success: false,
        message: "Too many requests, please try again later"
    }
});

module.exports = {
    authLimiter,
    generalLimiter
};