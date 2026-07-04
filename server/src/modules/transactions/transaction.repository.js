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

    async findFlagged({ page = 1, limit = 20 }, threshold = 0.7) {

        const skip = (page - 1) * limit;

        const [ transactions, total ] = await Promise.all([
            Transaction.find({ riskScore: { $gte: threshold } })
                .sort({ riskScore: -1, createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate("fromAccount", "user")
                .populate("toAccount", "user"),

            Transaction.countDocuments({ riskScore: { $gte: threshold } })
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

    async getSystemStats() {

        const [ totals, statusBreakdown, avgRisk ] = await Promise.all([
            Transaction.aggregate([
                { $match: { status: "COMPLETED" } },
                { $group: { _id: null, totalVolume: { $sum: "$amount" }, totalCount: { $sum: 1 } } }
            ]),
            Transaction.aggregate([
                { $group: { _id: "$status", count: { $sum: 1 } } }
            ]),
            Transaction.aggregate([
                { $match: { riskScore: { $ne: null } } },
                { $group: { _id: null, avgRiskScore: { $avg: "$riskScore" } } }
            ])
        ]);

        const flaggedCount = await Transaction.countDocuments({ riskScore: { $gte: 0.7 } });

        return {
            totalVolume: totals[ 0 ]?.totalVolume || 0,
            totalTransactions: totals[ 0 ]?.totalCount || 0,
            statusBreakdown: statusBreakdown.reduce((acc, row) => {
                acc[ row._id ] = row.count;
                return acc;
            }, {}),
            averageRiskScore: avgRisk[ 0 ]?.avgRiskScore || 0,
            flaggedCount
        };

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