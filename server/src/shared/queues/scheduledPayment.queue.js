const { Queue } = require("bullmq");
const connection = require("./redis.connection");

const scheduledPaymentQueue = new Queue("scheduled-payments", { connection });

const CRON_MAP = {
    DAILY: "0 9 * * *",       // every day at 9 AM
    WEEKLY: "0 9 * * 1",      // every Monday at 9 AM
    MONTHLY: "0 9 1 * *"      // 1st of every month at 9 AM
};

async function scheduleRecurringPayment(scheduledPaymentId, frequency) {

    const job = await scheduledPaymentQueue.add(
        "execute-scheduled-payment",
        { scheduledPaymentId },
        {
            repeat: { pattern: CRON_MAP[ frequency ] },
            jobId: `scheduled-${scheduledPaymentId}`,
            removeOnComplete: 50,
            removeOnFail: 200
        }
    );

    return job;

}

async function cancelRecurringPayment(scheduledPaymentId, frequency) {

    const repeatableJobs = await scheduledPaymentQueue.getRepeatableJobs();

    const target = repeatableJobs.find(
        (job) => job.id === `scheduled-${scheduledPaymentId}`
    );

    if (target) {
        await scheduledPaymentQueue.removeRepeatableByKey(target.key);
    }

}

module.exports = { scheduledPaymentQueue, scheduleRecurringPayment, cancelRecurringPayment, CRON_MAP };