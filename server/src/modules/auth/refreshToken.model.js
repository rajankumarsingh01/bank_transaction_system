const mongoose = require("mongoose");

const refreshTokenSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: [ true, "Refresh token must be associated with a user" ],
        index: true
    },
    tokenHash: {
        type: String,
        required: [ true, "Token hash is required" ],
        unique: true
    },
    expiresAt: {
        type: Date,
        required: [ true, "Expiry date is required" ]
    },
    revoked: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const refreshTokenModel = mongoose.model("refreshToken", refreshTokenSchema);

module.exports = refreshTokenModel;