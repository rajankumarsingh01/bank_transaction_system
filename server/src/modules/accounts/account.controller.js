const AccountService = require("./account.service");
const asyncHandler = require("../../shared/utils/asyncHandler");
const ApiResponse = require("../../shared/utils/ApiResponse");

const createAccount = asyncHandler(async (req, res) => {

    const account =
        await AccountService.createAccount(req.user._id);

    return res.status(201).json(
        new ApiResponse(201, account, "Account created successfully")
    );

});

const getMyAccount = asyncHandler(async (req, res) => {

    const account =
        await AccountService.getMyAccount(req.user._id);

    const balance =
        await account.getBalance();

    return res.json(
        new ApiResponse(200, { ...account.toObject(), balance })
    );

});

const updateAccountStatus = asyncHandler(async (req, res) => {

    const account =
        await AccountService.updateStatus(req.user._id, req.body.status);

    return res.json(
        new ApiResponse(200, account, "Account status updated successfully")
    );

});

module.exports = {
    createAccount,
    getMyAccount,
    updateAccountStatus
};