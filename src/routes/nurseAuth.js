/**
 * Nurse Authentication Routes
 * POST /api/nurse/auth/send-otp     — Send OTP (same Twilio endpoint)
 * POST /api/nurse/auth/verify-otp   — Verify OTP → create/find Nurse + issue JWT
 * POST /api/nurse/auth/resend-otp   — Resend OTP
 */
const express = require('express');
const router = express.Router();
const twilio = require('twilio');
const jwt = require('jsonwebtoken');
const Nurse = require('../models/Nurse');
const OtpVerification = require('../models/OtpVerification');

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// ── Send OTP ────────────────────────────────────────────────────────────────
router.post('/send-otp', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({
        error: 'Invalid phone number format. Use international format (e.g., +919876543210)',
      });
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await OtpVerification.deleteMany({ phoneNumber });
    await OtpVerification.create({ phoneNumber, otp, expiresAt });

    try {
      await twilioClient.messages.create({
        body: `Your VytalYou Nurse verification code is: ${otp}. Valid for 10 minutes.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber,
      });
      res.json({ success: true, message: 'OTP sent successfully', expiresIn: 600 });
    } catch (twilioError) {
      console.error('Twilio error (nurse):', twilioError);
      res.status(500).json({ error: 'Failed to send OTP.', details: twilioError.message });
    }
  } catch (error) {
    console.error('Nurse send OTP error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Verify OTP → Create/Find Nurse ──────────────────────────────────────────
router.post('/verify-otp', async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;
    if (!phoneNumber || !otp) {
      return res.status(400).json({ error: 'Phone number and OTP are required' });
    }

    // Find OTP record
    const otpRecord = await OtpVerification.findOne({
      phoneNumber,
      isVerified: false,
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({ error: 'No OTP found. Please request a new one.' });
    }
    if (new Date() > otpRecord.expiresAt) {
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }
    if (otpRecord.attempts >= 5) {
      return res.status(400).json({ error: 'Too many attempts. Please request a new OTP.' });
    }
    if (otpRecord.otp !== otp) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return res.status(400).json({ error: 'Invalid OTP', attemptsLeft: 5 - otpRecord.attempts });
    }

    // Mark verified
    otpRecord.isVerified = true;
    await otpRecord.save();

    // Find or create nurse
    let nurse = await Nurse.findOne({ phone: phoneNumber });

    if (!nurse) {
      nurse = await Nurse.create({
        phone: phoneNumber,
        isPhoneVerified: true,
        isOnboarded: false,
        isApproved: false,
      });
    } else {
      nurse.isPhoneVerified = true;
      await nurse.save();
    }

    // Generate JWT with nurseId
    const token = jwt.sign(
      { nurseId: nurse._id, phone: nurse.phone },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      token,
      nurse: nurse.toProfile(),
    });
  } catch (error) {
    console.error('Nurse verify OTP error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Resend OTP ──────────────────────────────────────────────────────────────
router.post('/resend-otp', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    await OtpVerification.deleteMany({ phoneNumber });

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await OtpVerification.create({ phoneNumber, otp, expiresAt });

    try {
      await twilioClient.messages.create({
        body: `Your VytalYou Nurse verification code is: ${otp}. Valid for 10 minutes.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber,
      });
      res.json({ success: true, message: 'OTP resent successfully', expiresIn: 600 });
    } catch (twilioError) {
      console.error('Twilio error (nurse resend):', twilioError);
      res.status(500).json({ error: 'Failed to send OTP', details: twilioError.message });
    }
  } catch (error) {
    console.error('Nurse resend OTP error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
