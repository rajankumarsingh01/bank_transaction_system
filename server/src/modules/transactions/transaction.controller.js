const TransactionService = require("./transaction.service");
const asyncHandler = require("../../shared/utils/asyncHandler");
const ApiResponse = require("../../shared/utils/ApiResponse");

const createTransaction = asyncHandler(async (req, res) => {

    const transaction =
        await TransactionService.transfer(req.body, req.user);

    return res.status(201).json(
        new ApiResponse(
            201,
            transaction,
            "Transaction completed successfully"
        )
    );

});

const createInitialFundsTransaction = asyncHandler(async (req, res) => {

    const transaction =
        await TransactionService.fundAccount(req.body, req.user);

    return res.status(201).json(
        new ApiResponse(
            201,
            transaction,
            "Initial funds transaction completed successfully"
        )
    );

});

module.exports = {
    createTransaction,
    createInitialFundsTransaction
};