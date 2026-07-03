const accountModel = require("./account.model");

class AccountRepository {

    async create(data) {
        return accountModel.create(data);
    }

    async findByUserId(userId) {
        return accountModel.findOne({
            user: userId
        });
    }

    async findById(id) {
        return accountModel.findById(id);
    }

    async findByIdForUpdate(id, session) {
        return accountModel.findById(id).session(session);
    }

    async update(id, data) {
        return accountModel.findByIdAndUpdate(
            id,
            data,
            { new: true }
        );
    }

}

module.exports = new AccountRepository();