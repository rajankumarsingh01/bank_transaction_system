const IORedis = require("ioredis");
const logger = require("../logger/logger");

let connection;

if (process.env.REDIS_URL) {

    // Production (Upstash, Redis Cloud, etc.) — full URL with TLS
    connection = new IORedis(process.env.REDIS_URL, {
        maxRetriesPerRequest: null,
        tls: {} // required for rediss:// (TLS) URLs
    });

} else {

    // Local development — plain host/port, no TLS
    connection = new IORedis({
        host: process.env.REDIS_HOST || "localhost",
        port: Number(process.env.REDIS_PORT) || 6379,
        maxRetriesPerRequest: null
    });

}

connection.on("connect", () => {
    logger.info("Connected to Redis");
});

connection.on("error", (err) => {
    logger.error({ err: err.message }, "Redis connection error");
});

module.exports = connection;