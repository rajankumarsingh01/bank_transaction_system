const IORedis = require("ioredis");
const logger = require("../logger/logger");

const connection = new IORedis({
    host: process.env.REDIS_HOST || "localhost",
    port: Number(process.env.REDIS_PORT) || 6379,
    maxRetriesPerRequest: null // required by BullMQ
});

connection.on("connect", () => {
    logger.info("Connected to Redis");
});

connection.on("error", (err) => {
    logger.error({ err: err.message }, "Redis connection error");
});

module.exports = connection;