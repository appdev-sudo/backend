const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Nurse = require('../models/Nurse');
const Booking = require('../models/Booking');
const User = require('../models/User');
const MedicalService = require('../models/MedicalService');
const adminAuth = require('../middleware/adminAuth');

// ── Authentication ────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const admin = await Admin.findOne({ email }).select('+password');
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET || 'secret123', {
      expiresIn: '7d',
    });

    res.json({
      success: true,
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      }
    });
  } catch (error) {
    console.error('Admin Login Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ── Nurses Management ───────────────────────────────────────────────────────
// Get all nurses
router.get('/nurses', adminAuth, async (req, res) => {
  try {
    const nurses = await Nurse.find().sort({ createdAt: -1 });
    res.json({ success: true, nurses });
  } catch (error) {
    console.error('Fetch Nurses Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Approve/Reject nurse
router.put('/nurses/:id/approve', adminAuth, async (req, res) => {
  try {
    const { isApproved } = req.body; // true or false
    const nurse = await Nurse.findByIdAndUpdate(
      req.params.id,
      { isApproved },
      { new: true }
    );
    if (!nurse) {
      return res.status(404).json({ success: false, message: 'Nurse not found' });
    }
    res.json({ success: true, nurse });
  } catch (error) {
    console.error('Approve Nurse Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ── Bookings Management ─────────────────────────────────────────────────────
// Get all bookings
router.get('/bookings', adminAuth, async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('user', 'name phone email')
      .populate('nurse', 'name phone nurseId')
      .sort({ createdAt: -1 });
    res.json({ success: true, bookings });
  } catch (error) {
    console.error('Fetch Bookings Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Assign a nurse to a booking
router.post('/bookings/:id/assign', adminAuth, async (req, res) => {
  try {
    const { nurseId } = req.body;
    
    const nurse = await Nurse.findById(nurseId);
    if (!nurse) {
      return res.status(404).json({ success: false, message: 'Nurse not found' });
    }
    
    if (!nurse.isApproved || !nurse.isActive) {
      return res.status(400).json({ success: false, message: 'Nurse is not approved or active' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    if (booking.status === 'completed' || booking.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Cannot assign nurse to a completed or cancelled booking' });
    }

    booking.nurse = nurseId;
    booking.status = 'assigned';
    
    // Clear rejected array in case we are re-assigning manually
    booking.rejectedBy = [];
    
    await booking.save();
    
    const updatedBooking = await Booking.findById(req.params.id)
      .populate('user', 'name phone email')
      .populate('nurse', 'name phone nurseId');

    res.json({ success: true, booking: updatedBooking });
  } catch (error) {
    console.error('Assign Nurse Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create Offline Booking
router.post('/offline-booking', adminAuth, async (req, res) => {
  try {
    const {
      name, phone, email, age, sex,
      serviceId, preferredDate, preferredTimeSlot,
      street, city, state, pincode, nurseId
    } = req.body;

    if (!phone || !serviceId) {
      return res.status(400).json({ success: false, message: 'Phone and Service ID are required.' });
    }

    // 1. Find or create the User
    let user = await User.findOne({ phone });
    if (!user) {
      user = new User({
        name,
        phone,
        email,
        age,
        sex,
        isPhoneVerified: false, // Since it's offline, they haven't verified OTP
      });
      await user.save();
    } else {
      // Update existing user with any new info if provided
      if (name) user.name = name;
      if (email) user.email = email;
      if (age) user.age = age;
      if (sex) user.sex = sex;
      await user.save();
    }

    // 2. Find the Service
    const service = await MedicalService.findOne({ serviceId });
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found.' });
    }

    // 3. Create the Booking
    const booking = new Booking({
      user: user._id,
      service: service._id,
      serviceId: service.serviceId,
      serviceTitle: service.title,
      preferredDate,
      preferredTimeSlot,
      address: {
        street,
        city,
        state,
        pincode,
        country: 'India'
      },
      status: 'pending'
    });

    // 4. Assign Nurse immediately if provided
    if (nurseId) {
      const nurse = await Nurse.findById(nurseId);
      if (nurse && nurse.isApproved && nurse.isActive) {
        booking.nurse = nurse._id;
        booking.status = 'assigned';
      }
    }

    await booking.save();
    
    // Populate user and nurse for immediate frontend display
    const populatedBooking = await Booking.findById(booking._id)
      .populate('user', 'name phone email')
      .populate('nurse', 'name phone nurseId');

    res.json({ success: true, booking: populatedBooking });
  } catch (error) {
    console.error('Offline Booking Error:', error);
    res.status(500).json({ success: false, message: 'Server error creating offline booking.' });
  }
});

// Dashboard stats
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const totalBookings = await Booking.countDocuments();
    const pendingBookings = await Booking.countDocuments({ status: 'pending' });
    const totalNurses = await Nurse.countDocuments();
    const approvedNurses = await Nurse.countDocuments({ isApproved: true });
    
    res.json({
      success: true,
      stats: {
        totalBookings,
        pendingBookings,
        totalNurses,
        approvedNurses,
      }
    });
  } catch (error) {
    console.error('Fetch Stats Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
