const express = require('express');
const Booking = require('../models/Booking');
const Subscription = require('../models/Subscription');
const MedicalService = require('../models/MedicalService');
const Nurse = require('../models/Nurse');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);

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

    const subscriptionIds = ['starter-evolution', 'renewal-series', 'complete-recode'];

    if (subscriptionIds.includes(service.serviceId) || service.serviceType === 'subscription') {
      const sessionNames = getSubscriptionSessions(service.serviceId);
      
      const subscription = new Subscription({
        user: req.user._id,
        service: service._id,
        serviceTitle: service.title,
        totalSessions: sessionNames.length,
        paymentStatus: req.body.paymentId ? 'paid' : 'pending',
        paymentId: req.body.paymentId || undefined,
      });
      await subscription.save();

      const childBookings = sessionNames.map((name, index) => {
        return {
          user: req.user._id,
          service: service._id,
          serviceId: service.serviceId,
          serviceTitle: service.title,
          address: req.body.address,
          notes: notes || undefined,
          paymentStatus: req.body.paymentId ? 'paid' : 'pending',
          paymentId: req.body.paymentId || undefined,
          
          isSubscriptionSession: true,
          parentSubscription: subscription._id,
          sessionName: name,
          sessionOrder: index + 1,
          locationType: 'home', // default
          // Only the first session gets the requested date
          preferredDate: index === 0 && preferredDate ? new Date(preferredDate) : undefined,
          preferredTimeSlot: index === 0 ? preferredTimeSlot || undefined : undefined,
        };
      });

      const insertedBookings = await Booking.insertMany(childBookings);
      // Return the first booking or the subscription
      return res.status(201).json({
        subscription,
        bookings: insertedBookings,
        message: 'Subscription created'
      });
    }

    // Standard individual booking
    const booking = new Booking({
      user: req.user._id,
      service: service._id,
      serviceId: service.serviceId,
      serviceTitle: service.title,
      preferredDate: preferredDate ? new Date(preferredDate) : undefined,
      preferredTimeSlot: preferredTimeSlot || undefined,
      address: req.body.address,
      notes: notes || undefined,
      paymentStatus: req.body.paymentId ? 'paid' : 'pending',
      paymentId: req.body.paymentId || undefined,
    });
    await booking.save();
    await booking.populate('service', 'title category price');
    res.status(201).json(booking);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to create booking.' });
  }
});

// GET /api/bookings/me — list current user's bookings (with nurse info)
router.get('/me', async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id, isSubscriptionSession: { $ne: true } })
      .sort({ createdAt: -1 })
      .populate('service', 'title category price serviceId')
      .populate('nurse', 'name phone nurseId');
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to fetch bookings.' });
  }
});

// GET /api/subscriptions/me — list current user's subscriptions
router.get('/subscriptions/me', async (req, res) => {
  try {
    const subscriptions = await Subscription.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate('service', 'title category price serviceId');
      
    const populatedSubs = await Promise.all(subscriptions.map(async (sub) => {
      const sessions = await Booking.find({ parentSubscription: sub._id })
        .populate('nurse', 'name phone nurseId')
        .sort({ sessionOrder: 1 });
      return { ...sub.toObject(), sessions };
    }));
    res.json(populatedSubs);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to fetch subscriptions.' });
  }
});

// GET /api/bookings/:id — single booking (own only) with nurse + OTP info
router.get('/:id', async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      user: req.user._id,
    })
      .populate('service', 'title category price serviceId fullDescription')
      .populate('nurse', 'name phone nurseId');

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found.' });
    }
    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to fetch booking.' });
  }
});

module.exports = router;
