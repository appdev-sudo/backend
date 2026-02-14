const mongoose = require('mongoose');

const otpVerificationSchema = new mongoose.Schema(
    {
        phoneNumber: { type: String, required: true, trim: true },
        otp: { type: String, required: true },
        isVerified: { type: Boolean, default: false },
        expiresAt: { type: Date, required: true },
        attempts: { type: Number, default: 0 },
    },
    { timestamps: true }
);

// Index to automatically delete expired OTPs
otpVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('OtpVerification', otpVerificationSchema);
