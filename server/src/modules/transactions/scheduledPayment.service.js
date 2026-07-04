const ScheduledPaymentModel = require("./scheduledPayment.model");
const AccountRepository = require("../accounts/account.repository");
const ApiError = require("../../shared/utils/ApiError");
const { scheduleRecurringPayment, cancelRecurringPayment } = require("../../shared/queues/scheduledPayment.queue");

class ScheduledPaymentService {

    async create(data, user) {

        const senderAccount = await AccountRepository.findById(data.fromAccount);
        const receiverAccount = await AccountRepository.findById(data.toAccount);

        if (!senderAccount || !receiverAccount) {
            throw new ApiError(404, "Invalid account");
        }

        if (senderAccount.user.toString() !== user._id.toString()) {
            throw new ApiError(403, "You can only schedule payments from your own account");
        }

        if (data.fromAccount === data.toAccount) {
            throw new ApiError(400, "fromAccount and toAccount cannot be the same");
        }

        const payment = await ScheduledPaymentModel.create({
            fromAccount: data.fromAccount,
            toAccount: data.toAccount,
            amount: data.amount,
            frequency: data.frequency,
            createdBy: user._id
        });

        await scheduleRecurringPayment(payment._id.toString(), data.frequency);

        return payment;

    }

    async listForUser(userId) {

        const account = await AccountRepository.findByUserId(userId);

        if (!account) {
            return [];
        }

        return ScheduledPaymentModel.find({ fromAccount: account._id }).sort({ createdAt: -1 });

    }

    async cancel(paymentId, user) {

        const payment = await ScheduledPaymentModel.findById(paymentId);

        if (!payment) {
            throw new ApiError(404, "Scheduled payment not found");
        }

        if (payment.createdBy.toString() !== user._id.toString()) {
            throw new ApiError(403, "You are not authorized to cancel this payment");
        }

        payment.status = "CANCELLED";
        await payment.save();

        await cancelRecurringPayment(payment._id.toString(), payment.frequency);

        return payment;

    }

}

module.exports = new ScheduledPaymentService();