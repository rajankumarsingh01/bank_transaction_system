const TransactionRepository = require("./transaction.repository");
const LedgerRepository = require("./ledger.repository");
const AccountRepository = require("../accounts/account.repository");

const withTransaction = require("../../shared/database/transaction");

const ApiError = require("../../shared/utils/ApiError");
const emailService = require("../notifications/email.service");
const FraudService = require("./fraud.service");


class TransactionService {

    async validateIdempotency(idempotencyKey) {

        const transaction =
            await TransactionRepository.findByIdempotencyKey(
                idempotencyKey
            );

        if (!transaction)
            return;

        switch (transaction.status) {

            case "COMPLETED":
                throw new ApiError(409, "Transaction already processed");

            case "PENDING":
                throw new ApiError(409, "Transaction is already processing");

            case "FAILED":
                throw new ApiError(409, "Previous transaction failed");

            case "REVERSED":
                throw new ApiError(409, "Transaction was reversed");

        }

    }

    async validateAccountsBasic(fromAccount, toAccount) {

        const sender = await AccountRepository.findById(fromAccount);
        const receiver = await AccountRepository.findById(toAccount);

        if (!sender || !receiver) {
            throw new ApiError(404, "Invalid Account");
        }

        if (sender.status !== "ACTIVE") {
            throw new ApiError(400, "Sender account is not active");
        }

        if (receiver.status !== "ACTIVE") {
            throw new ApiError(400, "Receiver account is not active");
        }

        return { sender, receiver };

    }

    async computeFraudFeatures(fromAccountId, amount) {

        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

        const [ senderTxnCountLastHour, avgAmount ] = await Promise.all([
            TransactionRepository.countRecentBySender(fromAccountId, oneHourAgo),
            TransactionRepository.getAverageAmountBySender(fromAccountId)
        ]);

        const account = await AccountRepository.findById(fromAccountId);

        const accountAgeDays =
            (Date.now() - account.createdAt.getTime()) / (1000 * 60 * 60 * 24);

        const amountVsAvgRatio = avgAmount ? amount / avgAmount : 1;

        return {
            senderTxnCountLastHour,
            amountVsAvgRatio,
            accountAgeDays
        };

    }

    async createPendingTransaction(data, session) {

        return TransactionRepository.create(
            {
                fromAccount: data.fromAccount,
                toAccount: data.toAccount,
                amount: data.amount,
                idempotencyKey: data.idempotencyKey,
                status: "PENDING",
                riskScore: data.riskScore ?? null
            },
            session
        );

    }

    async processDebit(transaction, amount, session) {

        return LedgerRepository.debit(
            transaction.fromAccount,
            amount,
            transaction._id,
            session
        );

    }

    async processCredit(transaction, amount, session) {

        return LedgerRepository.credit(
            transaction.toAccount,
            amount,
            transaction._id,
            session
        );

    }

    async completeTransaction(transactionId, session) {

        return TransactionRepository.updateStatus(
            transactionId,
            "COMPLETED",
            session
        );

    }

    async transfer(data, user) {

        await this.validateIdempotency(data.idempotencyKey);

        // Basic pre-check (fast fail before opening a session)
        await this.validateAccountsBasic(data.fromAccount, data.toAccount);

        // ---- Fraud Check (ML microservice) ----
        const isNewReceiver =
            !(await TransactionRepository.hasPriorTransactionToReceiver(
                data.fromAccount,
                data.toAccount
            ));

        const { senderTxnCountLastHour, amountVsAvgRatio, accountAgeDays } =
            await this.computeFraudFeatures(data.fromAccount, data.amount);

        const fraudResult = await FraudService.getFraudScore({
            amount: data.amount,
            hour: new Date().getHours(),
            sender_txn_count_last_hour: senderTxnCountLastHour,
            amount_vs_avg_ratio: amountVsAvgRatio,
            is_new_receiver: isNewReceiver ? 1 : 0,
            account_age_days: accountAgeDays
        });

        if (fraudResult.is_flagged) {
            throw new ApiError(
                403,
                `Transaction blocked: flagged as high risk by fraud detection (score: ${fraudResult.fraud_score})`
            );
        }

        data.riskScore = fraudResult.fraud_score;
        // ---- End Fraud Check ----

        const transaction = await withTransaction(async (session) => {

            // ⚠️ CRITICAL: balance re-check HOTA HAI session ke andar,
            // isliye MongoDB ka transaction-level consistency use hoti hai —
            // koi doosri parallel transaction isi account ke ledger ko
            // isi waqt commit nahi kar sakti jab tak yeh session complete na ho.
            const sender =
                await AccountRepository.findByIdForUpdate(
                    data.fromAccount,
                    session
                );

            if (!sender || sender.status !== "ACTIVE") {
                throw new ApiError(400, "Sender account is not active");
            }

            const balance = await sender.getBalance(session);

            if (balance < data.amount) {
                throw new ApiError(
                    400,
                    `Insufficient balance : ${balance}`
                );
            }

            const pending =
                await this.createPendingTransaction(data, session);

            await this.processDebit(pending, data.amount, session);
            await this.processCredit(pending, data.amount, session);

            return await this.completeTransaction(pending._id, session);

        });

        await emailService.sendTransactionEmail(
            user.email,
            user.name,
            data.amount,
            data.toAccount
        );

        return transaction;

    }

    async fundAccount(data, systemUser) {

        await this.validateIdempotency(data.idempotencyKey);

        const systemAccount =
            await AccountRepository.findByUserId(systemUser._id);

        if (!systemAccount) {
            throw new ApiError(404, "System account not found");
        }

        const receiver =
            await AccountRepository.findById(data.toAccount);

        if (!receiver) {
            throw new ApiError(404, "Invalid toAccount");
        }

        if (receiver.status !== "ACTIVE") {
            throw new ApiError(400, "Receiver account is not active");
        }

        if (systemAccount._id.toString() === data.toAccount) {
            throw new ApiError(
                400,
                "fromAccount and toAccount cannot be the same"
            );
        }

        const transaction = await withTransaction(async (session) => {

            const pending =
                await this.createPendingTransaction(
                    {
                        fromAccount: systemAccount._id,
                        toAccount: data.toAccount,
                        amount: data.amount,
                        idempotencyKey: data.idempotencyKey
                    },
                    session
                );

            await this.processDebit(pending, data.amount, session);
            await this.processCredit(pending, data.amount, session);

            return await this.completeTransaction(pending._id, session);

        });

        return transaction;

    }

    async reverseTransaction(transactionId, requestingUser) {

        const original = await TransactionRepository.findById(transactionId);

        if (!original) {
            throw new ApiError(404, "Transaction not found");
        }

        if (original.status !== "COMPLETED") {
            throw new ApiError(
                400,
                "Only completed transactions can be reversed"
            );
        }

        if (original.reversalOf) {
            throw new ApiError(
                400,
                "A reversal transaction cannot itself be reversed"
            );
        }

        const existingReversal = await TransactionRepository.findByIdempotencyKey(
            `reversal-${original._id}`
        );

        if (existingReversal) {
            throw new ApiError(409, "This transaction has already been reversed");
        }

        // Authorization: only the original sender, receiver, or a system user can reverse
        const senderAccount = await AccountRepository.findById(original.fromAccount);
        const receiverAccount = await AccountRepository.findById(original.toAccount);

        const isParty =
            senderAccount?.user.toString() === requestingUser._id.toString() ||
            receiverAccount?.user.toString() === requestingUser._id.toString();

        if (!isParty && !requestingUser.systemUser) {
            throw new ApiError(403, "You are not authorized to reverse this transaction");
        }

        const reversal = await withTransaction(async (session) => {

            const reversalTxn = await this.createPendingTransaction(
                {
                    fromAccount: original.toAccount,
                    toAccount: original.fromAccount,
                    amount: original.amount,
                    idempotencyKey: `reversal-${original._id}`
                },
                session
            );

            reversalTxn.reversalOf = original._id;
            await reversalTxn.save({ session });

            await this.processDebit(reversalTxn, original.amount, session);
            await this.processCredit(reversalTxn, original.amount, session);

            await this.completeTransaction(reversalTxn._id, session);

            await TransactionRepository.updateStatus(
                original._id,
                "REVERSED",
                session
            );

            return reversalTxn;

        });

        return reversal;

    }

    async getHistory(accountId, pagination) {
        return TransactionRepository.findForAccount(accountId, pagination);
    }

}

module.exports = new TransactionService();