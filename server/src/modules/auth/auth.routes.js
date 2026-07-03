const express = require("express");

const authController = require("./auth.controller");
const validate = require("../../shared/middleware/validate.middleware");
const { authLimiter } = require("../../shared/middleware/rateLimiter.middleware");

const {
    registerSchema,
    loginSchema
} = require("./auth.validation");

const { authMiddleware } = require("../../shared/middleware/auth.middleware");

const router = express.Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Rajan
 *               email:
 *                 type: string
 *                 example: rajan@test.com
 *               password:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       201:
 *         description: User registered successfully, returns access and refresh tokens
 *       400:
 *         description: Validation error
 *       409:
 *         description: User already exists
 */
router.post(
    "/register",
    authLimiter,
    validate(registerSchema),
    authController.userRegisterController
);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login with email and password
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful, returns access and refresh tokens
 *       401:
 *         description: Invalid email or password
 */
router.post(
    "/login",
    authLimiter,
    validate(loginSchema),
    authController.userLoginController
);

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Rotate refresh token and get a new access token
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: New access and refresh tokens issued
 *       401:
 *         description: Invalid or expired refresh token
 */
router.post(
    "/refresh",
    authLimiter,
    authController.refreshTokenController
);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout and blacklist current tokens
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         description: Unauthorized
 */
router.post(
    "/logout",
    authMiddleware,
    authController.userLogoutController
);

module.exports = router;