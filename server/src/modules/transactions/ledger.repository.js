const Ledger = require("./ledger.model");

class LedgerRepository {

    async debit(account, amount, transaction, session) {

        return Ledger.create([{
            account,
            amount,
            transaction,
            type: "DEBIT"
        }], { session });

    }

    async credit(account, amount, transaction, session) {

        return Ledger.create([{
            account,
            amount,
            transaction,
            type: "CREDIT"
        }], { session });

    }

}

module.exports = new LedgerRepository();