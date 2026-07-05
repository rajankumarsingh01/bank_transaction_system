const userModel = require("../users/user.model");
const tokenBlackListModel = require("../../models/blackList.model");

class AuthRepository {

 async findUserByEmail(email) {
        return userModel.findOne({ email }).select("+password +isAdmin +systemUser");
    }

    async findUserById(id) {
        return userModel.findById(id).select("+isAdmin +systemUser");
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