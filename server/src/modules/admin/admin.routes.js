const express = require("express");

const controller = require("./admin.controller");
const { authAdminMiddleware } = require("../../shared/middleware/auth.middleware");

const router = express.Router();

/**
 * @openapi
 * /admin/transactions/flagged:
 *   get:
 *     tags: [Admin]
 *     summary: Get transactions flagged as elevated/high risk (admin only)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Paginated flagged transactions
 *       403:
 *         description: Admin privileges required
 */
router.get(
    "/transactions/flagged",
    authAdminMiddleware,
    controller.getFlaggedTransactions
);

/**
 * @openapi
 * /admin/stats:
 *   get:
 *     tags: [Admin]
 *     summary: Get system-wide transaction stats (admin only)
 *     responses:
 *       200:
 *         description: System stats
 */
router.get(
    "/stats",
    authAdminMiddleware,
    controller.getStats
);

module.exports = router;