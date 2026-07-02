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

router.post(
    "/",
    authMiddleware,
    validate(transferSchema),
    controller.createTransaction
);

router.post(
    "/system/initial-funds",
    authSystemUserMiddleware,
    validate(fundAccountSchema),
    controller.createInitialFundsTransaction
);

module.exports = router;