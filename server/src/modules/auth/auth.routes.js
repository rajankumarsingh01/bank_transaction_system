const express = require("express");

const authController = require("./auth.controller");
const validate = require("../../shared/middleware/validate.middleware");

const {
    registerSchema,
    loginSchema
} = require("./auth.validation");

const { authMiddleware } = require("../../shared/middleware/auth.middleware");

const router = express.Router();

router.post(
    "/register",
    validate(registerSchema),
    authController.userRegisterController
);

router.post(
    "/login",
    validate(loginSchema),
    authController.userLoginController
);

router.post(
    "/logout",
    authMiddleware,
    authController.userLogoutController
);

module.exports = router;