const userModel = require("../users/user.model");
const tokenBlackListModel = require("../../models/blackList.model");

class AuthRepository {

    async findUserByEmail(email) {
        return userModel.findOne({ email }).select("+password");
    }

    async findUserById(id) {
        return userModel.findById(id);
    }

    async createUser(userData) {
        return userModel.create(userData);
    }

    async blacklistToken(token) {
        return tokenBlackListModel.create({ token });
    }

    async isTokenBlacklisted(token) {
        return tokenBlackListModel.findOne({ token });
    }
}

module.exports = new AuthRepository();