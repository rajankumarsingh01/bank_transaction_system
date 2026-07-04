const ScheduledPaymentService = require("./scheduledPayment.service");
const asyncHandler = require("../../shared/utils/asyncHandler");
const ApiResponse = require("../../shared/utils/ApiResponse");

const createScheduledPayment = asyncHandler(async (req, res) => {

    const payment = await ScheduledPaymentService.create(req.body, req.user);

    return res.status(201).json(
        new ApiResponse(201, payment, "Scheduled payment created successfully")
    );

});

const listScheduledPayments = asyncHandler(async (req, res) => {

    const payments = await ScheduledPaymentService.listForUser(req.user._id);

    return res.status(200).json(
        new ApiResponse(200, payments, "Scheduled payments fetched successfully")
    );

});

const cancelScheduledPayment = asyncHandler(async (req, res) => {

    const payment = await ScheduledPaymentService.cancel(req.params.id, req.user);

    return res.status(200).json(
        new ApiResponse(200, payment, "Scheduled payment cancelled successfully")
    );

});

module.exports = {
    createScheduledPayment,
    listScheduledPayments,
    cancelScheduledPayment
};