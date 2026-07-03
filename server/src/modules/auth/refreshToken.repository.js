const crypto = require("crypto");
const RefreshToken = require("./refreshToken.model");

function hashToken(token) {
    return crypto.createHash("sha256").update(token).digest("hex");
}

class RefreshTokenRepository {

    async create(userId, token, expiresAt) {
        return RefreshToken.create({
            user: userId,
            tokenHash: hashToken(token),
            expiresAt
        });
    }

    async findValid(token) {
        return RefreshToken.findOne({
            tokenHash: hashToken(token),
            revoked: false,
            expiresAt: { $gt: new Date() }
        });
    }

    async revoke(token) {
        return RefreshToken.findOneAndUpdate(
            { tokenHash: hashToken(token) },
            { revoked: true }
        );
    }

    async revokeAllForUser(userId) {
        return RefreshToken.updateMany(
            { user: userId, revoked: false },
            { revoked: true }
        );
    }

}

module.exports = new RefreshTokenRepository();