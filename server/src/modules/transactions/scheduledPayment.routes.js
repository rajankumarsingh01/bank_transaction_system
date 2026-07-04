const express = require("express");

const controller = require("./scheduledPayment.controller");
const validate = require("../../shared/middleware/validate.middleware");
const { createScheduledPaymentSchema } = require("./scheduledPayment.validation");
const { authMiddleware } = require("../../shared/middleware/auth.middleware");

const router = express.Router();

router.post("/", authMiddleware, validate(createScheduledPaymentSchema), controller.createScheduledPayment);
router.get("/", authMiddleware, controller.listScheduledPayments);
router.post("/:id/cancel", authMiddleware, controller.cancelScheduledPayment);

module.exports = router;