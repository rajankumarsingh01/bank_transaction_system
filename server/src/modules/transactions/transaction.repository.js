const Transaction = require("./transaction.model");

class TransactionRepository {

    async create(data, session) {
        const transaction = await Transaction.create(
            [data],
            { session }
        );

        return transaction[0];
    }

    async findByIdempotencyKey(idempotencyKey) {
        return Transaction.findOne({ idempotencyKey });
    }

    async updateStatus(id, status, session) {
        return Transaction.findByIdAndUpdate(
            id,
            { status },
            {
                new: true,
                session
            }
        );
    }
}

module.exports = new TransactionRepository();