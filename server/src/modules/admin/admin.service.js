const TransactionRepository = require("../transactions/transaction.repository");

class AdminService {

    async getFlaggedTransactions(pagination) {

        const threshold = Number(process.env.FRAUD_SCORE_THRESHOLD) || 0.7;

        // Admin panel shows a slightly lower bar than the auto-block threshold,
        // surfacing "elevated risk" transactions too, not just outright-blocked ones
        const reviewThreshold = Math.max(0, threshold - 0.2);

        return TransactionRepository.findFlagged(pagination, reviewThreshold);

    }

    async getStats() {
        return TransactionRepository.getSystemStats();
    }

}

module.exports = new AdminService();