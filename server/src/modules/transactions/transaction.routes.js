const express = require("express");

const controller = require("./transaction.controller");
const validate = require("../../shared/middleware/validate.middleware");

const {
    transferSchema,
    fundAccountSchema
} = require("./transaction.validation");

const {
    authMiddleware,
    authSystemUserMiddleware
} = require("../../shared/middleware/auth.middleware");

const router = express.Router();

/**
 * @openapi
 * /transactions:
 *   post:
 *     tags: [Transactions]
 *     summary: Transfer funds between two accounts
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fromAccount, toAccount, amount, idempotencyKey]
 *             properties:
 *               fromAccount:
 *                 type: string
 *               toAccount:
 *                 type: string
 *               amount:
 *                 type: number
 *                 example: 1500
 *               idempotencyKey:
 *                 type: string
 *                 example: transfer-001
 *     responses:
 *       201:
 *         description: Transaction completed successfully
 *       400:
 *         description: Insufficient balance or invalid accounts
 *       409:
 *         description: Duplicate idempotency key
 */
router.post(
    "/",
    authMiddleware,
    validate(transferSchema),
    controller.createTransaction
);

/**
 * @openapi
 * /transactions/system/initial-funds:
 *   post:
 *     tags: [Transactions]
 *     summary: Fund a user account from the system account (system user only)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [toAccount, amount, idempotencyKey]
 *             properties:
 *               toAccount:
 *                 type: string
 *               amount:
 *                 type: number
 *               idempotencyKey:
 *                 type: string
 *     responses:
 *       201:
 *         description: Initial funds transaction completed
 *       403:
 *         description: Not a system user
 */
router.post(
    "/system/initial-funds",
    authSystemUserMiddleware,
    validate(fundAccountSchema),
    controller.createInitialFundsTransaction
);

/**
 * @openapi
 * /transactions/{id}/reverse:
 *   post:
 *     tags: [Transactions]
 *     summary: Reverse a completed transaction
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Transaction reversed successfully
 *       400:
 *         description: Only completed transactions can be reversed
 *       403:
 *         description: Not authorized to reverse this transaction
 *       409:
 *         description: Transaction already reversed
 */
router.post(
    "/:id/reverse",
    authMiddleware,
    controller.reverseTransaction
);

/**
 * @openapi
 * /transactions/me:
 *   get:
 *     tags: [Transactions]
 *     summary: Get paginated transaction history for logged-in user's account
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Paginated list of transactions
 */
router.get(
    "/me",
    authMiddleware,
    controller.getMyTransactionHistory
);

module.exports = router;