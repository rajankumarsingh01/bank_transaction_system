const { Worker } = require("bullmq");
const connection = require("./redis.connection");
const logger = require("../logger/logger");

function startScheduledPaymentWorker() {

    const worker = new Worker(
        "scheduled-payments",
        async (job) => {

            // Lazy require to avoid circular dependency at module load time
            const ScheduledPaymentModel = require("../../modules/transactions/scheduledPayment.model");
            const TransactionService = require("../../modules/transactions/transaction.service");
            const AccountRepository = require("../../modules/accounts/account.repository");

            const { scheduledPaymentId } = job.data;

            const payment = await ScheduledPaymentModel.findById(scheduledPaymentId);

            if (!payment || payment.status !== "ACTIVE") {
                logger.info({ scheduledPaymentId }, "Skipping inactive/deleted scheduled payment");
                return;
            }

            const senderAccount = await AccountRepository.findById(payment.fromAccount);

            if (!senderAccount) {
                payment.lastRunAt = new Date();
                payment.lastRunStatus = "FAILED";
                await payment.save();
                return;
            }

            try {

                const senderUser = { _id: senderAccount.user, email: null, name: "Scheduled Payment" };

                // Fetch full user for email context
                const userModel = require("../../modules/users/user.model");
                const fullUser = await userModel.findById(senderAccount.user);

                await TransactionService.transfer(
                    {
                        fromAccount: payment.fromAccount.toString(),
                        toAccount: payment.toAccount.toString(),
                        amount: payment.amount,
                        idempotencyKey: `scheduled-${payment._id}-${new Date().toISOString().slice(0, 10)}`
                    },
                    fullUser
                );

                payment.lastRunAt = new Date();
                payment.lastRunStatus = "SUCCESS";
                await payment.save();

                logger.info({ scheduledPaymentId }, "Scheduled payment executed successfully");

            } catch (err) {

                payment.lastRunAt = new Date();
                payment.lastRunStatus = "FAILED";
                await payment.save();

                logger.error({ scheduledPaymentId, err: err.message }, "Scheduled payment execution failed");

            }

        },
        { connection, concurrency: 3 }
    );

    worker.on("failed", (job, err) => {
        logger.error({ jobId: job?.id, err: err.message }, "Scheduled payment job failed");
    });

    return worker;

}

module.exports = startScheduledPaymentWorker;