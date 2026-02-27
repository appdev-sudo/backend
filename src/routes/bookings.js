const express = require('express');
const Booking = require('../models/Booking');
const MedicalService = require('../models/MedicalService');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);

// POST /api/bookings — create booking (logged-in user)
router.post('/', async (req, res) => {
  try {
    const { serviceId, preferredDate, preferredTimeSlot, notes } = req.body;
    if (!serviceId) {
      return res.status(400).json({ error: 'Service ID is required.' });
    }
    const service = await MedicalService.findOne({ serviceId });
    if (!service) {
      return res.status(404).json({ error: 'Service not found.' });
    }
    const booking = new Booking({
      user: req.user._id,
      service: service._id,
      serviceId: service.serviceId,
      serviceTitle: service.title,
      preferredDate: preferredDate ? new Date(preferredDate) : undefined,

      preferredTimeSlot: preferredTimeSlot || undefined,
      address: req.body.address,
      notes: notes || undefined,
      paymentStatus: 'pending', // Default for now until payment flow is integrated
    });
    await booking.save();
    await booking.populate('service', 'title category price');
    res.status(201).json(booking);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to create booking.' });
  }
});

// GET /api/bookings/me — list current user's bookings
router.get('/me', async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate('service', 'title category price serviceId');
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to fetch bookings.' });
  }
});

// GET /api/bookings/:id — single booking (own only)
router.get('/:id', async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).populate('service', 'title category price serviceId fullDescription');
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found.' });
    }
    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to fetch booking.' });
  }
});

module.exports = router;
