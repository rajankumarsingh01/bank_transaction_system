const express = require("express");

const controller = require("./account.controller");

const {
    authMiddleware
} = require("../../shared/middleware/auth.middleware");

const router = express.Router();

router.post(
    "/",
    authMiddleware,
    controller.createAccount
);

router.get(
    "/me",
    authMiddleware,
    controller.getMyAccount
);

module.exports = router;