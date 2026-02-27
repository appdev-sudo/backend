const express = require('express');
const router = express.Router();
const twilio = require('twilio');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const OtpVerification = require('../models/OtpVerification');

// Initialize Twilio client
const twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

// Generate 6-digit OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP to phone number
router.post('/send-otp', async (req, res) => {
    try {
        const { phoneNumber } = req.body;

        if (!phoneNumber) {
            return res.status(400).json({ error: 'Phone number is required' });
        }

        // Validate phone number format (basic validation)
        const phoneRegex = /^\+[1-9]\d{1,14}$/;
        if (!phoneRegex.test(phoneNumber)) {
            return res.status(400).json({
                error: 'Invalid phone number format. Use international format (e.g., +919876543210)'
            });
        }

        // Generate OTP
        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Delete any existing OTP for this phone number
        await OtpVerification.deleteMany({ phoneNumber });

        // Save OTP to database
        await OtpVerification.create({
            phoneNumber,
            otp,
            expiresAt,
        });

        // Send OTP via Twilio
        try {
            await twilioClient.messages.create({
                body: `Your VytalYou verification code is: ${otp}. Valid for 10 minutes.`,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: phoneNumber,
            });

            res.json({
                success: true,
                message: 'OTP sent successfully',
                expiresIn: 600 // seconds
            });
        } catch (twilioError) {
            console.error('Twilio error:', twilioError);
            res.status(500).json({
                error: 'Failed to send OTP. Please check your phone number.',
                details: twilioError.message
            });
        }
    } catch (error) {
        console.error('Send OTP error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Verify OTP and create/login user
router.post('/verify-otp', async (req, res) => {
    try {
        const { phoneNumber, otp } = req.body;

        if (!phoneNumber || !otp) {
            return res.status(400).json({ error: 'Phone number and OTP are required' });
        }

        // Find OTP verification record
        const otpRecord = await OtpVerification.findOne({
            phoneNumber,
            isVerified: false
        }).sort({ createdAt: -1 });

        if (!otpRecord) {
            return res.status(400).json({ error: 'No OTP found. Please request a new one.' });
        }

        // Check if OTP is expired
        if (new Date() > otpRecord.expiresAt) {
            return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
        }

        // Check if too many attempts
        if (otpRecord.attempts >= 5) {
            return res.status(400).json({ error: 'Too many attempts. Please request a new OTP.' });
        }

        // Verify OTP
        if (otpRecord.otp !== otp) {
            otpRecord.attempts += 1;
            await otpRecord.save();
            return res.status(400).json({
                error: 'Invalid OTP',
                attemptsLeft: 5 - otpRecord.attempts
            });
        }

        // Mark OTP as verified
        otpRecord.isVerified = true;
        await otpRecord.save();

        // Find or create user
        let user = await User.findOne({ phone: phoneNumber });

        if (!user) {
            user = await User.create({
                phone: phoneNumber,
                isPhoneVerified: true,
                profileCompleted: false,
                location: {
                    latitude: 0,
                    longitude: 0,
                    address: {
                        street: '',
                        landmark: '',
                        city: '',
                        state: '',
                        pincode: '',
                        country: '',
                        formattedAddress: ''
                    }
                }
            });
        } else {
            user.isPhoneVerified = true;
            await user.save();
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, phone: user.phone },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                phone: user.phone,
                name: user.name,
                email: user.email,
                age: user.age,
                sex: user.sex,
                // weight: user.weight,
                // height: user.height,
                // comorbidities: user.comorbidities,
                // medications: user.medications,
                location: user.location,
                isPhoneVerified: user.isPhoneVerified,
                profileCompleted: user.profileCompleted,
            },
        });
    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Resend OTP
router.post('/resend-otp', async (req, res) => {
    try {
        const { phoneNumber } = req.body;

        if (!phoneNumber) {
            return res.status(400).json({ error: 'Phone number is required' });
        }

        // Delete existing OTPs
        await OtpVerification.deleteMany({ phoneNumber });

        // Generate new OTP
        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        await OtpVerification.create({
            phoneNumber,
            otp,
            expiresAt,
        });

        // Send OTP via Twilio
        try {
            await twilioClient.messages.create({
                body: `Your VytalYou verification code is: ${otp}. Valid for 10 minutes.`,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: phoneNumber,
            });

            res.json({
                success: true,
                message: 'OTP resent successfully',
                expiresIn: 600
            });
        } catch (twilioError) {
            console.error('Twilio error:', twilioError);
            res.status(500).json({
                error: 'Failed to send OTP',
                details: twilioError.message
            });
        }
    } catch (error) {
        console.error('Resend OTP error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
