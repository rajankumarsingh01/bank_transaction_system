const jwt = require("jsonwebtoken");

const authRepository = require("./auth.repository");
const emailService = require("../notifications/email.service");
const ApiError = require("../../shared/utils/ApiError");

class AuthService {

    async register({ email, password, name }) {

        const existingUser = await authRepository.findUserByEmail(email);

        if (existingUser) {
           throw new ApiError(
    409,
    "User already exists"
);
        }

        const user = await authRepository.createUser({
            email,
            password,
            name
        });

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "3d" }
        );

        // Fire and Forget
        emailService
            .sendRegistrationEmail(user.email, user.name)
            .catch(console.error);

        return {
            user: {
                _id: user._id,
                email: user.email,
                name: user.name
            },
            token
        };
    }

    async login({ email, password }) {

        const user = await authRepository.findUserByEmail(email);

        if (!user) {
           throw new ApiError(
    401,
    "Invalid email or password"
);
        }

        const isValid = await user.comparePassword(password);

        if (!isValid) {
           throw new ApiError(
    401,
    "Invalid email or password"
);
        }

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "3d" }
        );

        return {
            user: {
                _id: user._id,
                email: user.email,
                name: user.name
            },
            token
        };
    }

    async logout(token) {

        if (!token) {
            return;
        }

        await authRepository.blacklistToken(token);
    }

}

module.exports = new AuthService();