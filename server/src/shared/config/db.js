const mongoose = require("mongoose")
const logger = require("../logger/logger")

function connectToDB() {

    mongoose.connect(process.env.MONGO_URI)
        .then(() => {
            logger.info("Server is connected to DB")
        })
        .catch(err => {
            logger.error({ err }, "Error connecting to DB")
            process.exit(1)
        })

}

module.exports = connectToDB