const TransactionService = require("./transaction.service");
const AccountService = require("../accounts/account.service");
const asyncHandler = require("../../shared/utils/asyncHandler");
const ApiResponse = require("../../shared/utils/ApiResponse");

const createTransaction = asyncHandler(async (req, res) => {

    const transaction =
        await TransactionService.transfer(req.body, req.user);

    return res.status(201).json(
        new ApiResponse(201, transaction, "Transaction completed successfully")
    );

});

const createInitialFundsTransaction = asyncHandler(async (req, res) => {

    const transaction =
        await TransactionService.fundAccount(req.body, req.user);

    return res.status(201).json(
        new ApiResponse(201, transaction, "Initial funds transaction completed successfully")
    );

});

const reverseTransaction = asyncHandler(async (req, res) => {

    const reversal =
        await TransactionService.reverseTransaction(req.params.id, req.user);

    return res.status(201).json(
        new ApiResponse(201, reversal, "Transaction reversed successfully")
    );

});

const getMyTransactionHistory = asyncHandler(async (req, res) => {

    const account = await AccountService.getMyAccount(req.user._id);

    const { page = 1, limit = 20 } = req.query;

    const history = await TransactionService.getHistory(
        account._id,
        { page: Number(page), limit: Number(limit) }
    );

    return res.status(200).json(
        new ApiResponse(200, history, "Transaction history fetched successfully")
    );

});

module.exports = {
    createTransaction,
    createInitialFundsTransaction,
    reverseTransaction,
    getMyTransactionHistory
};