const TransactionRepository = require("./transaction.repository");
const LedgerRepository = require("./ledger.repository");
const AccountRepository = require("../accounts/account.repository");

const withTransaction = require("../../shared/database/transaction");

const ApiError = require("../../shared/utils/ApiError");
const emailService = require("../notifications/email.service");


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
            throw new ApiError(
                409,
                "Transaction already processed"
            );

        case "PENDING":
            throw new ApiError(
                409,
                "Transaction is already processing"
            );

        case "FAILED":
            throw new ApiError(
                409,
                "Previous transaction failed"
            );

        case "REVERSED":
            throw new ApiError(
                409,
                "Transaction was reversed"
            );

    }

}

async validateAccounts(fromAccount,toAccount){

    const sender =
        await AccountRepository.findById(fromAccount);

    const receiver =
        await AccountRepository.findById(toAccount);

    if(!sender || !receiver){

        throw new ApiError(
            404,
            "Invalid Account"
        );

    }

    if(sender.status!=="ACTIVE"){

        throw new ApiError(
            400,
            "Sender account is not active"
        );

    }

    if(receiver.status!=="ACTIVE"){

        throw new ApiError(
            400,
            "Receiver account is not active"
        );

    }

    return {
        sender,
        receiver
    };

}

async validateBalance(sender,amount){

    const balance =
        await sender.getBalance();

    if(balance<amount){

        throw new ApiError(
            400,
            `Insufficient balance : ${balance}`
        );

    }

}

async createPendingTransaction(data, session) {

    return TransactionRepository.create(
        {
            fromAccount: data.fromAccount,
            toAccount: data.toAccount,
            amount: data.amount,
            idempotencyKey: data.idempotencyKey,
            status: "PENDING"
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

    await this.validateIdempotency(
        data.idempotencyKey
    );

    const { sender } =
        await this.validateAccounts(
            data.fromAccount,
            data.toAccount
        );

    await this.validateBalance(
        sender,
        data.amount
    );

    const transaction =
        await withTransaction(async (session) => {

            const pending =
                await this.createPendingTransaction(
                    data,
                    session
                );

            await this.processDebit(
                pending,
                data.amount,
                session
            );

            await this.processCredit(
                pending,
                data.amount,
                session
            );

            return await this.completeTransaction(
                pending._id,
                session
            );

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

    await this.validateIdempotency(
        data.idempotencyKey
    );

    const systemAccount =
        await AccountRepository.findByUserId(
            systemUser._id
        );

    if (!systemAccount) {
        throw new ApiError(
            404,
            "System account not found"
        );
    }

    const receiver =
        await AccountRepository.findById(
            data.toAccount
        );

    if (!receiver) {
        throw new ApiError(
            404,
            "Invalid toAccount"
        );
    }

    if (receiver.status !== "ACTIVE") {
        throw new ApiError(
            400,
            "Receiver account is not active"
        );
    }

    if (systemAccount._id.toString() === data.toAccount) {
        throw new ApiError(
            400,
            "fromAccount and toAccount cannot be the same"
        );
    }

    const transaction =
        await withTransaction(async (session) => {

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

            await this.processDebit(
                pending,
                data.amount,
                session
            );

            await this.processCredit(
                pending,
                data.amount,
                session
            );

            return await this.completeTransaction(
                pending._id,
                session
            );

        });

    return transaction;

}


}

module.exports = new TransactionService();