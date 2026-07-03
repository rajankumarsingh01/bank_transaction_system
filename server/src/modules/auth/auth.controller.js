const authService = require("./auth.service");
const asyncHandler = require("../../shared/utils/asyncHandler");
const ApiResponse = require("../../shared/utils/ApiResponse");

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict"
};

const userRegisterController = asyncHandler(async (req, res) => {

    const result = await authService.register(req.body);

    res.cookie("accessToken", result.accessToken, cookieOptions);
    res.cookie("refreshToken", result.refreshToken, cookieOptions);

    return res.status(201).json(
        new ApiResponse(201, result, "User registered successfully")
    );

});

const userLoginController = asyncHandler(async (req, res) => {

    const result = await authService.login(req.body);

    res.cookie("accessToken", result.accessToken, cookieOptions);
    res.cookie("refreshToken", result.refreshToken, cookieOptions);

    return res.status(200).json(
        new ApiResponse(200, result, "Login successful")
    );

});

const refreshTokenController = asyncHandler(async (req, res) => {

    const oldRefreshToken =
        req.cookies.refreshToken || req.body.refreshToken;

    const result = await authService.refresh(oldRefreshToken);

    res.cookie("accessToken", result.accessToken, cookieOptions);
    res.cookie("refreshToken", result.refreshToken, cookieOptions);

    return res.status(200).json(
        new ApiResponse(200, result, "Token refreshed successfully")
    );

});

const userLogoutController = asyncHandler(async (req, res) => {

    const accessToken =
        req.cookies.accessToken ||
        req.headers.authorization?.split(" ")[ 1 ];

    const refreshToken = req.cookies.refreshToken;

    await authService.logout(accessToken, refreshToken);

    res.clearCookie("accessToken", cookieOptions);
    res.clearCookie("refreshToken", cookieOptions);

    return res.status(200).json(
        new ApiResponse(200, null, "Logout successful")
    );

});

module.exports = {
    userRegisterController,
    userLoginController,
    refreshTokenController,
    userLogoutController
};