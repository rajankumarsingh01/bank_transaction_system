const pinoHttp = require("pino-http");
const crypto = require("crypto");
const logger = require("./logger");

const requestLogger = pinoHttp({
    logger,

    genReqId: (req, res) => {
        const existingId = req.headers[ "x-request-id" ];
        const id = existingId || crypto.randomUUID();
        res.setHeader("x-request-id", id);
        return id;
    },

    customLogLevel: (req, res, err) => {
        if (res.statusCode >= 500 || err) return "error";
        if (res.statusCode >= 400) return "warn";
        return "info";
    },

    customSuccessMessage: (req, res) => {
        return `${req.method} ${req.url} completed with ${res.statusCode}`;
    },

    customErrorMessage: (req, res, err) => {
        return `${req.method} ${req.url} failed with ${res.statusCode}: ${err.message}`;
    },

    serializers: {
        req: (req) => ({
            method: req.method,
            url: req.url,
            id: req.id
        }),
        res: (res) => ({
            statusCode: res.statusCode
        })
    }
});

module.exports = requestLogger;