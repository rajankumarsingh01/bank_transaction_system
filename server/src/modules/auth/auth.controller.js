const authService = require("./auth.service");

const asyncHandler = require("../../shared/utils/asyncHandler");
const ApiResponse = require("../../shared/utils/ApiResponse");

const userRegisterController = asyncHandler(async (req, res) => {

    const result = await authService.register(req.body);

    res.cookie("token", result.token);

    return res.status(201).json(
        new ApiResponse(
            201,
            result,
            "User registered successfully"
        )
    );

});

const userLoginController = asyncHandler(async (req, res) => {

    const result = await authService.login(req.body);

    res.cookie("token", result.token);

    return res.status(200).json(
        new ApiResponse(
            200,
            result,
            "Login successful"
        )
    );

});

const userLogoutController = asyncHandler(async (req, res) => {

    const token =
        req.cookies.token ||
        req.headers.authorization?.split(" ")[1];

    await authService.logout(token);

    res.clearCookie("token");

    return res.status(200).json(
        new ApiResponse(
            200,
            null,
            "Logout successful"
        )
    );

});

module.exports = {
    userRegisterController,
    userLoginController,
    userLogoutController
};