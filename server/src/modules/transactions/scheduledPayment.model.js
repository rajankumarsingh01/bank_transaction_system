const mongoose = require("mongoose");

const scheduledPaymentSchema = new mongoose.Schema({
    fromAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "account",
        required: true,
        index: true
    },
    toAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "account",
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: [ 0.01, "Amount must be greater than 0" ]
    },
    frequency: {
        type: String,
        enum: [ "DAILY", "WEEKLY", "MONTHLY" ],
        required: true
    },
    status: {
        type: String,
        enum: [ "ACTIVE", "PAUSED", "CANCELLED" ],
        default: "ACTIVE"
    },
    bullJobId: {
        type: String,
        default: null
    },
    lastRunAt: {
        type: Date,
        default: null
    },
    lastRunStatus: {
        type: String,
        enum: [ "SUCCESS", "FAILED", null ],
        default: null
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("scheduledPayment", scheduledPaymentSchema);