const { Worker } = require("bullmq");
const connection = require("./redis.connection");
const emailService = require("../../modules/notifications/email.service");
const logger = require("../logger/logger");

function startEmailWorker() {

    const worker = new Worker(
        "email-notifications",
        async (job) => {

            if (job.name === "transaction-email") {

                const { userEmail, name, amount, toAccount } = job.data;
                await emailService.sendTransactionEmail(userEmail, name, amount, toAccount);

            } else if (job.name === "registration-email") {

                const { userEmail, name } = job.data;
                await emailService.sendRegistrationEmail(userEmail, name);

            }

        },
        { connection, concurrency: 5 }
    );

    worker.on("completed", (job) => {
        logger.info({ jobId: job.id, jobName: job.name }, "Email job completed");
    });

    worker.on("failed", (job, err) => {
        logger.error(
            { jobId: job?.id, jobName: job?.name, err: err.message, attempts: job?.attemptsMade },
            "Email job failed"
        );
    });

    return worker;

}

module.exports = startEmailWorker;