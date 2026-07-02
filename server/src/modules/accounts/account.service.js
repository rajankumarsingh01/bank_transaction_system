const AccountRepository = require("./account.repository");
const ApiError = require("../../shared/utils/ApiError");

class AccountService {

    async createAccount(userId) {

        const existing =
            await AccountRepository.findByUserId(userId);

        if (existing) {
            throw new ApiError(
                409,
                "Account already exists"
            );
        }

        const account =
            await AccountRepository.create({
                user: userId
            });

        return account;
    }

    async getMyAccount(userId) {

        const account =
            await AccountRepository.findByUserId(userId);

        if (!account) {
            throw new ApiError(
                404,
                "Account not found"
            );
        }

        return account;

    }

}

module.exports = new AccountService();