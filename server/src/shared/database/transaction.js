const mongoose = require("mongoose");
const logger = require("../logger/logger");

async function withTransaction(callback) {

    const session = await mongoose.startSession();

    session.startTransaction();

    try {

        const result = await callback(session);

        await session.commitTransaction();

        return result;

    }
    catch (err) {

        await session.abortTransaction();

        logger.error({ err: err.message }, "Transaction aborted");

        throw err;

    }
    finally {

        session.endSession();

    }

}

module.exports = withTransaction;