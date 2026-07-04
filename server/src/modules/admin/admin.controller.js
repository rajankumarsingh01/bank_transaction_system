const AdminService = require("./admin.service");
const asyncHandler = require("../../shared/utils/asyncHandler");
const ApiResponse = require("../../shared/utils/ApiResponse");

const getFlaggedTransactions = asyncHandler(async (req, res) => {

    const { page = 1, limit = 20 } = req.query;

    const result = await AdminService.getFlaggedTransactions({
        page: Number(page),
        limit: Number(limit)
    });

    return res.status(200).json(
        new ApiResponse(200, result, "Flagged transactions fetched successfully")
    );

});

const getStats = asyncHandler(async (req, res) => {

    const stats = await AdminService.getStats();

    return res.status(200).json(
        new ApiResponse(200, stats, "System stats fetched successfully")
    );

});

module.exports = {
    getFlaggedTransactions,
    getStats
};