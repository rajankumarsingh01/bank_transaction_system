const { Queue } = require("bullmq");
const connection = require("./redis.connection");

const emailQueue = new Queue("email-notifications", { connection });

async function enqueueTransactionEmail(userEmail, name, amount, toAccount) {

    await emailQueue.add(
        "transaction-email",
        { userEmail, name, amount, toAccount },
        {
            attempts: 3,
            backoff: { type: "exponential", delay: 2000 },
            removeOnComplete: 100,
            removeOnFail: 500
        }
    );

}

async function enqueueRegistrationEmail(userEmail, name) {

    await emailQueue.add(
        "registration-email",
        { userEmail, name },
        {
            attempts: 3,
            backoff: { type: "exponential", delay: 2000 },
            removeOnComplete: 100,
            removeOnFail: 500
        }
    );

}

module.exports = { emailQueue, enqueueTransactionEmail, enqueueRegistrationEmail };