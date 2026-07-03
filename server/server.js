require("dotenv").config()

const validateEnv = require("./src/shared/config/env.validation")
validateEnv()

const http = require("http")
const app = require("./src/app")
const connectToDB = require("./src/shared/config/db")
const logger = require("./src/shared/logger/logger")
const { initSocket } = require("./src/shared/socket/socket.manager")
const startEmailWorker = require("./src/shared/queues/email.worker")

connectToDB()

const PORT = process.env.PORT || 3000

const httpServer = http.createServer(app)

initSocket(httpServer)

startEmailWorker()

httpServer.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`)
})

process.on("unhandledRejection", (reason) => {
    logger.error({ err: reason }, "Unhandled Promise Rejection")
    process.exit(1)
})

process.on("uncaughtException", (err) => {
    logger.error({ err }, "Uncaught Exception")
    process.exit(1)
})