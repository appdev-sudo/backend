/**
 * Nurse Booking Routes — Complete booking lifecycle management.
 *
 * GET    /api/nurse/bookings              — List bookings assigned to this nurse
 * GET    /api/nurse/bookings/available     — List available (unassigned) bookings for claiming
 * POST   /api/nurse/bookings/:id/claim    — Claim (self-assign) an available booking
 * GET    /api/nurse/bookings/:id          — Get single booking with populated customer info
 * POST   /api/nurse/bookings/:id/accept   — Accept a booking
 * POST   /api/nurse/bookings/:id/reject   — Reject a booking (reassigns)
 * POST   /api/nurse/bookings/:id/start    — Verify START OTP → begin service
 * POST   /api/nurse/bookings/:id/end      — Verify END OTP → complete service
 * POST   /api/nurse/bookings/:id/admin-chart  — Save vitals/admin chart
 * POST   /api/nurse/bookings/:id/consent      — Save consent
 * POST   /api/nurse/bookings/:id/feedback     — Submit post-service feedback
 * GET    /api/nurse/bookings/:id/inventory    — Get required inventory for booking
 */
const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Nurse = require('../models/Nurse');
const nurseAuth = require('../middleware/nurseAuth');

// All routes require nurse authentication
router.use(nurseAuth);

// Helper: Generate 6-digit OTP
const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// ── Default inventory is now handled dynamically in the Nurse App ───────────

// ═══════════════════════════════════════════════════════════════════════════
// GET /  — List bookings assigned to this nurse
// ═══════════════════════════════════════════════════════════════════════════
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { nurse: req.nurseId };

    if (status) {
      filter.status = status;
    }

    const bookings = await Booking.find(filter)
      .sort({ preferredDate: 1, createdAt: -1 })
      .populate('user', 'name phone age sex location')
      .populate('service', 'title category price serviceId');

    res.json(bookings);
  } catch (error) {
    console.error('Get nurse bookings error:', error);
    res.status(500).json({ error: 'Failed to fetch bookings.' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /available  — List all unassigned bookings that nurses can claim
// Shows: pending (no nurse assigned), paid bookings only
// ═══════════════════════════════════════════════════════════════════════════
router.get('/available', async (req, res) => {
  try {
    const bookings = await Booking.find({
      // No nurse assigned yet
      $or: [
        { nurse: null },
        { nurse: { $exists: false } },
      ],
      // Only show pending or confirmed (paid) bookings
      status: { $in: ['pending', 'confirmed'] },
    })
      .sort({ preferredDate: 1, createdAt: -1 })
      .populate('user', 'name phone age sex location')
      .populate('service', 'title category price serviceId');

    res.json(bookings);
  } catch (error) {
    console.error('Get available bookings error:', error);
    res.status(500).json({ error: 'Failed to fetch available bookings.' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// POST /:id/claim  — Nurse claims (self-assigns) an available booking
// ═══════════════════════════════════════════════════════════════════════════
router.post('/:id/claim', async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      // Must be unassigned
      $or: [
        { nurse: null },
        { nurse: { $exists: false } },
      ],
      status: { $in: ['pending', 'confirmed'] },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found or already claimed by another nurse.' });
    }

    // Assign to this nurse
    booking.nurse = req.nurseId;
    booking.status = 'assigned';

    // Generate START and END OTPs
    booking.startOtp = generateOTP();
    booking.endOtp = generateOTP();

    await booking.save();

    // Populate for response
    await booking.populate('user', 'name phone age sex location');
    await booking.populate('service', 'title category price serviceId');

    res.json({
      success: true,
      message: 'Booking claimed successfully! You can now accept or manage this booking.',
      booking,
    });
  } catch (error) {
    console.error('Claim booking error:', error);
    res.status(500).json({ error: 'Failed to claim booking.' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /:id  — Single booking with full customer info
// Allows viewing both assigned bookings AND available (unclaimed) bookings
// ═══════════════════════════════════════════════════════════════════════════
router.get('/:id', async (req, res) => {
  try {
    // ── DEBUG STEP 1: fetch raw (no populate) to see stored user field ────
    const rawBooking = await Booking.findOne({
      _id: req.params.id,
      $or: [
        { nurse: req.nurseId },
        { nurse: null },
        { nurse: { $exists: false } },
      ],
    }).lean();

    if (!rawBooking) {
      return res.status(404).json({ error: 'Booking not found.' });
    }

    console.log('\n[GET /booking/:id] === RAW (pre-populate) DEBUG ===');
    console.log('  rawBooking.user field:', rawBooking.user);
    console.log('  typeof rawBooking.user:', typeof rawBooking.user);
    console.log('  rawBooking.serviceTitle:', rawBooking.serviceTitle);
    console.log('  rawBooking.status:', rawBooking.status);

    // ── DEBUG STEP 2: manually look up the user using that ObjectId ───────
    if (rawBooking.user) {
      const User = require('../models/User');
      const foundUser = await User.findById(rawBooking.user).select('name phone age sex location').lean();
      console.log('  User.findById result:', JSON.stringify(foundUser, null, 2));
    } else {
      console.log('  rawBooking.user is null/undefined — no user reference stored!');
    }
    console.log('[GET /booking/:id] ===================================\n');
    // ── END DEBUG ─────────────────────────────────────────────────────────

    // Now do the real query with populate
    const booking = await Booking.findById(req.params.id)
      .populate('user', 'name phone age sex email location')
      .populate('service', 'title category price serviceId fullDescription');

    // ── FAILSAFE: if populate returned null for user, manually inject ───────
    // This happens when the user field is stored as a string instead of ObjectId
    let responseData = booking.toObject ? booking.toObject() : booking;
    if (!responseData.user && rawBooking.user) {
      const User = require('../models/User');
      const manualUser = await User.findById(rawBooking.user)
        .select('name phone age sex email location')
        .lean();
      if (manualUser) {
        responseData.user = manualUser;
        console.log('[GET /booking/:id] FAILSAFE: manually injected user:', manualUser.name, manualUser.phone);
      }
    }
    // ── END FAILSAFE ───────────────────────────────────────────────────────

    res.json(responseData);
  } catch (error) {
    console.error('Get nurse booking by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch booking.' });
  }
});



// ═══════════════════════════════════════════════════════════════════════════
// POST /:id/accept  — Accept a booking
// ═══════════════════════════════════════════════════════════════════════════
router.post('/:id/accept', async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      nurse: req.nurseId,
      status: 'assigned',
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found or not in assigned status.' });
    }

    booking.status = 'accepted';

    // Generate START and END OTPs for the service
    booking.startOtp = generateOTP();
    booking.endOtp = generateOTP();

    await booking.save();

    // Populate for response
    await booking.populate('user', 'name phone age sex location');
    await booking.populate('service', 'title category price serviceId');

    res.json({
      success: true,
      message: 'Booking accepted. START OTP has been generated.',
      booking,
    });
  } catch (error) {
    console.error('Accept booking error:', error);
    res.status(500).json({ error: 'Failed to accept booking.' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// POST /:id/reject  — Reject and reassign
// ═══════════════════════════════════════════════════════════════════════════
router.post('/:id/reject', async (req, res) => {
  try {
    const { reason } = req.body;

    const booking = await Booking.findOne({
      _id: req.params.id,
      nurse: req.nurseId,
      status: 'assigned',
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found or not in assigned status.' });
    }

    // Track who rejected
    if (!booking.rejectedBy) booking.rejectedBy = [];
    booking.rejectedBy.push(req.nurseId);
    booking.rejectionReason = reason || '';

    // Try to find another available, approved nurse who hasn't rejected
    const alternateNurse = await Nurse.findOne({
      _id: { $ne: req.nurseId, $nin: booking.rejectedBy },
      isApproved: true,
      isActive: true,
    });

    if (alternateNurse) {
      // Reassign to another nurse
      booking.nurse = alternateNurse._id;
      booking.status = 'assigned';
      booking.rejectionReason = '';
    } else {
      // No nurse available — set back to pending for admin to handle
      booking.nurse = undefined;
      booking.status = 'pending';
    }

    await booking.save();

    res.json({
      success: true,
      message: alternateNurse
        ? 'Booking rejected and reassigned to another nurse.'
        : 'Booking rejected. No alternate nurse available; booking returned to pending.',
    });
  } catch (error) {
    console.error('Reject booking error:', error);
    res.status(500).json({ error: 'Failed to reject booking.' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// POST /:id/start  — Verify START OTP → begin service
// ═══════════════════════════════════════════════════════════════════════════
router.post('/:id/start', async (req, res) => {
  try {
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({ error: 'OTP is required.' });
    }

    const booking = await Booking.findOne({
      _id: req.params.id,
      nurse: req.nurseId,
      status: 'accepted',
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found or not in accepted status.' });
    }

    if (booking.startOtp !== otp) {
      return res.status(400).json({ error: 'Invalid START OTP.' });
    }

    booking.status = 'in_progress';
    booking.startedAt = new Date();
    // NOTE: Keep startOtp so the customer can still see it was used on their profile
    // booking.startOtp is intentionally NOT cleared here

    await booking.save();
    await booking.populate('user', 'name phone age sex location');

    res.json({
      success: true,
      message: 'Service started successfully.',
      booking,
    });
  } catch (error) {
    console.error('Start service error:', error);
    res.status(500).json({ error: 'Failed to start service.' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// POST /:id/end  — Verify END OTP → complete service
// ═══════════════════════════════════════════════════════════════════════════
router.post('/:id/end', async (req, res) => {
  try {
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({ error: 'OTP is required.' });
    }

    const booking = await Booking.findOne({
      _id: req.params.id,
      nurse: req.nurseId,
      status: 'in_progress',
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found or not in progress.' });
    }

    if (booking.endOtp !== otp) {
      return res.status(400).json({ error: 'Invalid END OTP.' });
    }

    booking.status = 'completed';
    booking.completedAt = new Date();
    booking.endOtp = undefined;

    await booking.save();
    await booking.populate('user', 'name phone age sex location');

    res.json({
      success: true,
      message: 'Service completed successfully.',
      booking,
    });
  } catch (error) {
    console.error('End service error:', error);
    res.status(500).json({ error: 'Failed to end service.' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// POST /:id/admin-chart  — Record patient vitals
// ═══════════════════════════════════════════════════════════════════════════
router.post('/:id/admin-chart', async (req, res) => {
  try {
    const { bloodPressure, heartRate, temperature, spo2, weight, notes } = req.body;

    const booking = await Booking.findOne({
      _id: req.params.id,
      nurse: req.nurseId,
      status: 'in_progress',
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found or not in progress.' });
    }

    booking.adminChart = {
      bloodPressure,
      heartRate,
      temperature,
      spo2,
      weight,
      notes: notes || '',
      recordedAt: new Date(),
    };

    await booking.save();

    res.json({
      success: true,
      message: 'Admin chart saved successfully.',
    });
  } catch (error) {
    console.error('Admin chart error:', error);
    res.status(500).json({ error: 'Failed to save admin chart.' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// POST /:id/expenses  — Record expenses
// ═══════════════════════════════════════════════════════════════════════════
router.post('/:id/expenses', async (req, res) => {
  try {
    const { expenses } = req.body;

    if (!Array.isArray(expenses)) {
      return res.status(400).json({ error: 'Expenses must be an array.' });
    }

    const booking = await Booking.findOne({
      _id: req.params.id,
      nurse: req.nurseId,
      status: 'in_progress',
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found or not in progress.' });
    }

    booking.expenses = expenses;

    await booking.save();

    res.json({
      success: true,
      message: 'Expenses saved successfully.',
    });
  } catch (error) {
    console.error('Expenses error:', error);
    res.status(500).json({ error: 'Failed to save expenses.' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// POST /:id/consent  — Record consent
// ═══════════════════════════════════════════════════════════════════════════
router.post('/:id/consent', async (req, res) => {
  try {
    const { signed, signatureData } = req.body;

    const booking = await Booking.findOne({
      _id: req.params.id,
      nurse: req.nurseId,
      status: 'in_progress',
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found or not in progress.' });
    }

    booking.consentSigned = signed === true;
    if (signatureData) {
      booking.consentSignatureData = signatureData;
    }

    await booking.save();

    res.json({
      success: true,
      message: 'Consent recorded successfully.',
    });
  } catch (error) {
    console.error('Consent error:', error);
    res.status(500).json({ error: 'Failed to save consent.' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// POST /:id/feedback  — Submit nurse's post-service feedback
// ═══════════════════════════════════════════════════════════════════════════
router.post('/:id/feedback', async (req, res) => {
  try {
    const { rating, comments } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
    }

    const booking = await Booking.findOne({
      _id: req.params.id,
      nurse: req.nurseId,
      status: 'completed',
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found or not completed.' });
    }

    booking.feedback = {
      rating,
      comments: comments || '',
      submittedAt: new Date(),
    };

    await booking.save();

    res.json({
      success: true,
      message: 'Feedback submitted successfully.',
    });
  } catch (error) {
    console.error('Feedback error:', error);
    res.status(500).json({ error: 'Failed to submit feedback.' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /:id/inventory  — Get required inventory/kit for a booking
// ═══════════════════════════════════════════════════════════════════════════
router.get('/:id/inventory', async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      nurse: req.nurseId,
    }).populate('service', 'category');

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found.' });
    }

    // If booking already has custom inventory, return that
    if (booking.inventory && booking.inventory.length > 0) {
      return res.json({ inventory: booking.inventory });
    }

    // Otherwise, return empty array since the app handles its own master checklist
    res.json({ inventory: [] });
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({ error: 'Failed to fetch inventory.' });
  }
});

module.exports = router;
