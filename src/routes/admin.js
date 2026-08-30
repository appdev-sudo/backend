const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Nurse = require('../models/Nurse');
const Booking = require('../models/Booking');
const User = require('../models/User');
const MedicalService = require('../models/MedicalService');
const Subscription = require('../models/Subscription');
const CustomService = require('../models/CustomService');
const adminAuth = require('../middleware/adminAuth');

// Helper to get sessions based on serviceId
function getSubscriptionSessions(serviceId) {
  if (serviceId === 'starter-evolution') {
    return ["NAD 1", "NAD 2", "NAD 3", "VUC 1"];
  }
  if (serviceId === 'renewal-series') {
    return [
      "NAD 1", "VUC 1", "NAD 2", "VUC 2", "NAD 3", "VUC 3",
      "NAD 4", "VUC 4", "NAD 5", "VUC 5", "NAD 6", "VUC 6"
    ];
  }
  if (serviceId === 'complete-recode') {
    const sessions = [];
    for (let i = 1; i <= 10; i++) {
      sessions.push(`NAD ${i}`);
      sessions.push(`VUC ${i}`);
    }
    return sessions;
  }
  return ["Session 1"];
}

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

// ── Users Management ────────────────────────────────────────────────────────
// Search users by phone or name
router.get('/users/search', adminAuth, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 3) {
      return res.json({ success: true, users: [] });
    }
    
    // Normalize query for phone numbers (remove +91 if present for searching)
    const normalizedQuery = q.replace(/^\+91/, '').trim();
    
    const users = await User.find({
      $or: [
        { phone: { $regex: normalizedQuery, $options: 'i' } },
        { name: { $regex: q, $options: 'i' } }
      ]
    }).limit(10).select('name phone email age sex location');
    
    res.json({ success: true, users });
  } catch (error) {
    console.error('Search Users Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ── Bookings Management ─────────────────────────────────────────────────────
// Get all non-subscription bookings
router.get('/bookings', adminAuth, async (req, res) => {
  try {
    const bookings = await Booking.find({ isSubscriptionSession: { $ne: true } })
      .populate('user', 'name phone email')
      .populate('nurse', 'name phone nurseId')
      .sort({ createdAt: -1 });
    res.json({ success: true, bookings });
  } catch (error) {
    console.error('Fetch Bookings Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get all custom services
router.get('/custom-services', adminAuth, async (req, res) => {
  try {
    const services = await CustomService.find().sort({ createdAt: -1 });
    res.json({ success: true, services });
  } catch (error) {
    console.error('Fetch Custom Services Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create a new custom service
router.post('/custom-services', adminAuth, async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'Title is required' });
    
    // Check if it already exists
    const existing = await CustomService.findOne({ title });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Service already exists' });
    }

    const service = new CustomService({ title });
    await service.save();
    res.json({ success: true, service });
  } catch (error) {
    console.error('Create Custom Service Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get all subscriptions and their sessions
router.get('/subscriptions', adminAuth, async (req, res) => {
  try {
    const subscriptions = await Subscription.find()
      .populate('user', 'name phone email')
      .sort({ createdAt: -1 })
      .lean();
    
    // Fetch sessions for each subscription
    const populatedSubs = await Promise.all(subscriptions.map(async (sub) => {
      const sessions = await Booking.find({ parentSubscription: sub._id })
        .populate('nurse', 'name phone nurseId')
        .sort({ sessionOrder: 1 });
      return { ...sub, sessions };
    }));

    res.json({ success: true, subscriptions: populatedSubs });
  } catch (error) {
    console.error('Fetch Subscriptions Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Helper: Generate 6-digit OTP
const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

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
    
    // Generate OTPs if they don't exist yet
    if (!booking.startOtp) {
      booking.startOtp = generateOTP();
    }
    if (!booking.endOtp) {
      booking.endOtp = generateOTP();
    }
    
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
      street, city, state, pincode, nurseId, paymentStatus,
      locationType, clinicLocation, adminNote
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
        age,
        sex,
        isPhoneVerified: false, // Since it's offline, they haven't verified OTP
      });
      if (email && email.trim() !== '') {
        user.email = email.trim();
      }
      await user.save();
    } else {
      // Update existing user with any new info if provided
      if (name) user.name = name;
      if (email && email.trim() !== '') user.email = email.trim();
      if (age) user.age = age;
      if (sex) user.sex = sex;
      await user.save();
    }

    // 2. Find the Service
    let service = await MedicalService.findOne({ serviceId });
    if (!service) {
      // Check custom services
      const customService = await CustomService.findOne({ title: serviceId });
      if (!customService) {
        return res.status(404).json({ success: false, message: 'Service not found.' });
      }
      // Mock the service object for booking creation
      service = {
        _id: undefined,
        serviceId: customService.title,
        title: customService.title,
        serviceType: 'individual'
      };
    }

    // 3. Create the Booking or Subscription
    const subscriptionIds = ['starter-evolution', 'renewal-series', 'complete-recode'];

    if (subscriptionIds.includes(service.serviceId) || service.serviceType === 'subscription') {
      const sessionNames = getSubscriptionSessions(service.serviceId);
      
      const subscription = new Subscription({
        user: user._id,
        service: service._id,
        serviceTitle: service.title,
        totalSessions: sessionNames.length,
        paymentStatus: paymentStatus || 'pending'
      });
      await subscription.save();

      const childBookings = sessionNames.map((name, index) => {
        return {
          user: user._id,
          service: service._id,
          serviceId: service.serviceId,
          serviceTitle: service.title,
          address: { street, city, state, pincode, country: 'India' },
          adminNote,
          status: index === 0 && nurseId ? 'assigned' : 'pending',
          nurse: index === 0 && nurseId ? nurseId : undefined,
          isSubscriptionSession: true,
          parentSubscription: subscription._id,
          sessionName: name,
          sessionOrder: index + 1,
          locationType: locationType || 'home',
          clinicLocation: locationType === 'clinic' ? clinicLocation : undefined,
          paymentStatus: paymentStatus || 'pending',
          preferredDate: index === 0 ? preferredDate : undefined,
          preferredTimeSlot: index === 0 ? preferredTimeSlot : undefined,
          startOtp: index === 0 && nurseId ? generateOTP() : undefined,
          endOtp: index === 0 && nurseId ? generateOTP() : undefined,
        };
      });

      const insertedBookings = await Booking.insertMany(childBookings);
      const populatedBooking = await Booking.findById(insertedBookings[0]._id)
        .populate('user', 'name phone email')
        .populate('nurse', 'name phone nurseId');

      return res.json({ success: true, booking: populatedBooking });
    }

    // Standard individual booking
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
      status: 'pending',
      paymentStatus: paymentStatus || 'pending',
      locationType: locationType || 'home',
      clinicLocation: locationType === 'clinic' ? clinicLocation : undefined,
      adminNote
    });

    // 4. Assign Nurse immediately if provided
    if (nurseId) {
      const nurse = await Nurse.findById(nurseId);
      if (nurse && nurse.isApproved && nurse.isActive) {
        booking.nurse = nurse._id;
        booking.status = 'assigned';
        booking.startOtp = generateOTP();
        booking.endOtp = generateOTP();
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

// ── Clinic Actions ────────────────────────────────────────────────────────────

// Toggle location between home and clinic
router.put('/bookings/:id/location', adminAuth, async (req, res) => {
  try {
    const { locationType, clinicLocation } = req.body; // 'home' or 'clinic'
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    
    booking.locationType = locationType;
    if (locationType === 'clinic') {
      booking.clinicLocation = clinicLocation;
      booking.nurse = undefined;
      if (booking.status === 'assigned') booking.status = 'pending';
    }
    await booking.save();

    const updatedBooking = await Booking.findById(req.params.id)
      .populate('user', 'name phone email')
      .populate('nurse', 'name phone nurseId');
    res.json({ success: true, booking: updatedBooking });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Admin schedule a booking
router.put('/bookings/:id/schedule', adminAuth, async (req, res) => {
  try {
    const { preferredDate, preferredTimeSlot, address, clinicLocation, locationType } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    
    if (locationType) booking.locationType = locationType;
    if (preferredDate !== undefined) booking.preferredDate = preferredDate;
    if (preferredTimeSlot !== undefined) booking.preferredTimeSlot = preferredTimeSlot;
    
    if (booking.locationType === 'clinic' && clinicLocation) {
      booking.clinicLocation = clinicLocation;
    }

    if (address) {
      booking.address = {
        ...booking.address,
        ...address
      };
    }

    await booking.save();
    const updatedBooking = await Booking.findById(req.params.id)
      .populate('user', 'name phone email')
      .populate('nurse', 'name phone nurseId');
    res.json({ success: true, booking: updatedBooking });
  } catch (error) {
    console.error('Schedule Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Manually complete a clinic session
router.put('/bookings/:id/complete-clinic', adminAuth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    
    if (booking.locationType !== 'clinic') {
      return res.status(400).json({ success: false, message: 'Only clinic sessions can be manually completed here' });
    }

    booking.status = 'completed';
    booking.completedAt = new Date();
    await booking.save();

    // If part of a subscription, check if all are completed
    if (booking.parentSubscription) {
      const Subscription = require('../models/Subscription');
      const sub = await Subscription.findById(booking.parentSubscription);
      if (sub) {
        const incompleteCount = await Booking.countDocuments({
          parentSubscription: sub._id,
          status: { $ne: 'completed' }
        });
        if (incompleteCount === 0) {
          sub.status = 'completed';
          await sub.save();
        } else {
          // Increment completedSessions 
          sub.completedSessions = await Booking.countDocuments({
             parentSubscription: sub._id,
             status: 'completed'
          });
          await sub.save();
        }
      }
    }

    const updatedBooking = await Booking.findById(req.params.id)
      .populate('user', 'name phone email');
    res.json({ success: true, booking: updatedBooking });
  } catch (error) {
    console.error('Complete Clinic Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Full Edit Booking
router.put('/bookings/:id/edit', adminAuth, async (req, res) => {
  try {
    const { name, phone, age, sex, serviceId, serviceTitle } = req.body;
    const booking = await Booking.findById(req.params.id).populate('user');
    
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    // Update customer details on the user object
    if (booking.user) {
      if (name) booking.user.name = name;
      if (phone) booking.user.phone = phone;
      if (age) booking.user.age = age;
      if (sex) booking.user.sex = sex;
      await booking.user.save();
    }
    
    // Update booking service details
    if (serviceId) booking.serviceId = serviceId;
    if (serviceTitle) booking.serviceTitle = serviceTitle;
    
    await booking.save();
    
    const updatedBooking = await Booking.findById(req.params.id)
      .populate('user', 'name phone email age sex')
      .populate('nurse', 'name phone nurseId');
      
    res.json({ success: true, booking: updatedBooking });
  } catch (error) {
    console.error('Edit Booking Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete Booking
router.delete('/bookings/:id', adminAuth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    await Booking.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Booking deleted successfully' });
  } catch (error) {
    console.error('Delete Booking Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Dashboard stats
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const totalBookings = await Booking.countDocuments({ isSubscriptionSession: { $ne: true } });
    const totalSubscriptions = await Subscription.countDocuments();
    const pendingBookings = await Booking.countDocuments({ status: 'pending' });
    const totalNurses = await Nurse.countDocuments();
    const approvedNurses = await Nurse.countDocuments({ isApproved: true });
    
    res.json({
      success: true,
      stats: {
        totalBookings,
        totalSubscriptions,
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
