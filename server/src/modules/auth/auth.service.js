const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const authRepository = require("./auth.repository");
const refreshTokenRepository = require("./refreshToken.repository");
const { enqueueRegistrationEmail } = require("../../shared/queues/email.queue");
const ApiError = require("../../shared/utils/ApiError");
const parseDuration = require("../../shared/utils/parseDuration");

class AuthService {

    generateAccessToken(user) {
        return jwt.sign(
            { userId: user._id },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "15m" }
        );
    }

    async generateRefreshToken(user) {

        const token = crypto.randomBytes(40).toString("hex");
        const expiryString = process.env.REFRESH_TOKEN_EXPIRY || "7d";
        const expiresAt = new Date(Date.now() + parseDuration(expiryString));

        await refreshTokenRepository.create(user._id, token, expiresAt);

        return token;

    }

    async issueTokens(user) {

        const accessToken = this.generateAccessToken(user);
        const refreshToken = await this.generateRefreshToken(user);

        return { accessToken, refreshToken };

    }

   formatUser(user) {
        return {
            _id: user._id,
            email: user.email,
            name: user.name,
            isAdmin: !!user.isAdmin,
            systemUser: !!user.systemUser
        };
    }

    async register({ email, password, name }) {

        const existingUser = await authRepository.findUserByEmail(email);

        if (existingUser) {
            throw new ApiError(409, "User already exists");
        }

        const user = await authRepository.createUser({ email, password, name });

        const tokens = await this.issueTokens(user);

        enqueueRegistrationEmail(user.email, user.name)
            .catch((err) => console.error("Failed to enqueue registration email:", err));

        return {
            user: this.formatUser(user),
            ...tokens
        };

    }

    async login({ email, password }) {

        const user = await authRepository.findUserByEmail(email);

        if (!user) {
            throw new ApiError(401, "Invalid email or password");
        }

        const isValid = await user.comparePassword(password);

        if (!isValid) {
            throw new ApiError(401, "Invalid email or password");
        }

        const tokens = await this.issueTokens(user);

        return {
            user: this.formatUser(user),
            ...tokens
        };

    }

    async refresh(oldRefreshToken) {

        if (!oldRefreshToken) {
            throw new ApiError(401, "Refresh token is missing");
        }

        const stored = await refreshTokenRepository.findValid(oldRefreshToken);

        if (!stored) {
            throw new ApiError(401, "Invalid or expired refresh token");
        }

        const user = await authRepository.findUserById(stored.user);

        if (!user) {
            throw new ApiError(401, "User no longer exists");
        }

        await refreshTokenRepository.revoke(oldRefreshToken);

        const tokens = await this.issueTokens(user);

        return {
            user: this.formatUser(user),
            ...tokens
        };

    }

    async logout(accessToken, refreshToken) {

        if (accessToken) {
            await authRepository.blacklistToken(accessToken);
        }

        if (refreshToken) {
            await refreshTokenRepository.revoke(refreshToken);
        }

    }

}

module.exports = new AuthService();