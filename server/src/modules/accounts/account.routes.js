const express = require("express");

const controller = require("./account.controller");
const validate = require("../../shared/middleware/validate.middleware");
const { updateStatusSchema } = require("./account.validation");

const {
    authMiddleware
} = require("../../shared/middleware/auth.middleware");

const router = express.Router();

/**
 * @openapi
 * /accounts:
 *   post:
 *     tags: [Accounts]
 *     summary: Create an account for the logged-in user
 *     responses:
 *       201:
 *         description: Account created successfully
 *       409:
 *         description: Account already exists for this user
 */
router.post(
    "/",
    authMiddleware,
    controller.createAccount
);

/**
 * @openapi
 * /accounts/me:
 *   get:
 *     tags: [Accounts]
 *     summary: Get logged-in user's account with current balance
 *     responses:
 *       200:
 *         description: Account details with balance
 *       404:
 *         description: Account not found
 */
router.get(
    "/me",
    authMiddleware,
    controller.getMyAccount
);

/**
 * @openapi
 * /accounts/me/status:
 *   patch:
 *     tags: [Accounts]
 *     summary: Update account status (ACTIVE, FROZEN, CLOSED)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, FROZEN, CLOSED]
 *     responses:
 *       200:
 *         description: Account status updated
 *       400:
 *         description: Invalid status or non-zero balance on close
 */
router.patch(
    "/me/status",
    authMiddleware,
    validate(updateStatusSchema),
    controller.updateAccountStatus
);

module.exports = router;