const AccountRepository = require("./account.repository");
const ApiError = require("../../shared/utils/ApiError");

class AccountService {

    async createAccount(userId) {

        const existing =
            await AccountRepository.findByUserId(userId);

        if (existing) {
            throw new ApiError(409, "Account already exists");
        }

        const account =
            await AccountRepository.create({ user: userId });

        return account;
    }

    async getMyAccount(userId) {

        const account =
            await AccountRepository.findByUserId(userId);

        if (!account) {
            throw new ApiError(404, "Account not found");
        }

        return account;

    }

    async updateStatus(userId, newStatus) {

        const account =
            await AccountRepository.findByUserId(userId);

        if (!account) {
            throw new ApiError(404, "Account not found");
        }

        if (account.status === "CLOSED") {
            throw new ApiError(
                400,
                "Closed accounts cannot be reactivated. Contact support."
            );
        }

        if (newStatus === "CLOSED") {

            const balance = await account.getBalance();

            if (balance !== 0) {
                throw new ApiError(
                    400,
                    `Account cannot be closed with a non-zero balance (current balance: ${balance})`
                );
            }

        }

        const updated =
            await AccountRepository.update(account._id, { status: newStatus });

        return updated;

    }

}

module.exports = new AccountService();