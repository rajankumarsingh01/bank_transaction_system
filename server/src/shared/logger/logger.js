const pino = require("pino");

const isDev = process.env.NODE_ENV === "development";
const isTest = process.env.NODE_ENV === "test";

const logger = pino({
    level: process.env.LOG_LEVEL || (isDev ? "debug" : "info"),
    transport: isDev
        ? {
            target: "pino-pretty",
            options: {
                colorize: true,
                translateTime: "SYS:standard",
                ignore: "pid,hostname"
            }
        }
        : undefined,
    redact: {
        paths: [
            "req.headers.authorization",
            "req.headers.cookie",
            "password",
            "*.password",
            "token",
            "*.token",
            "accessToken",
            "refreshToken"
        ],
        censor: "[REDACTED]"
    }
});

module.exports = logger;