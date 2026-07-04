const Transaction = require("./transaction.model");

class TransactionRepository {

    async create(data, session) {
        const transaction = await Transaction.create(
            [ data ],
            { session }
        );

        return transaction[ 0 ];
    }

    async findByIdempotencyKey(idempotencyKey) {
        return Transaction.findOne({ idempotencyKey });
    }

    async findById(id) {
        return Transaction.findById(id);
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

    async countRecentBySender(accountId, sinceDate) {
        return Transaction.countDocuments({
            fromAccount: accountId,
            createdAt: { $gte: sinceDate }
        });
    }

    async getAverageAmountBySender(accountId) {

        const result = await Transaction.aggregate([
            { $match: { fromAccount: accountId, status: "COMPLETED" } },
            { $group: { _id: null, avgAmount: { $avg: "$amount" } } }
        ]);

        return result.length ? result[ 0 ].avgAmount : null;

    }

    async hasPriorTransactionToReceiver(fromAccount, toAccount) {

        const existing = await Transaction.findOne({
            fromAccount,
            toAccount,
            status: "COMPLETED"
        });

        return !!existing;

    }

    async getAnalyticsSummary(accountId, sinceDate) {

        const results = await Transaction.aggregate([
            {
                $match: {
                    $or: [ { fromAccount: accountId }, { toAccount: accountId } ],
                    status: "COMPLETED",
                    createdAt: { $gte: sinceDate }
                }
            },
            {
                $group: {
                    _id: {
                        direction: {
                            $cond: [ { $eq: [ "$fromAccount", accountId ] }, "sent", "received" ]
                        },
                        day: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }
                    },
                    total: { $sum: "$amount" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id.day": 1 } }
        ]);

        return results;

    }

    

    async findForAccount(accountId, { page = 1, limit = 20 }) {

        const skip = (page - 1) * limit;

        const [ transactions, total ] = await Promise.all([
            Transaction.find({
                $or: [
                    { fromAccount: accountId },
                    { toAccount: accountId }
                ]
            })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),

            Transaction.countDocuments({
                $or: [
                    { fromAccount: accountId },
                    { toAccount: accountId }
                ]
            })
        ]);

        return {
            transactions,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / limit)
            }
        };

    }

}

module.exports = new TransactionRepository();    