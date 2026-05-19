require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

const authRoutes = require('./routes/auth');
const servicesRoutes = require('./routes/services');
const bookingsRoutes = require('./routes/bookings');
const phoneAuthRoutes = require('./routes/phoneAuth');
const profileRoutes = require('./routes/profile');
const paymentsRoutes = require('./routes/payments');
const blogRoutes = require('./routes/blogs');

// Nurse-specific routes
const nurseAuthRoutes = require('./routes/nurseAuth');
const nurseProfileRoutes = require('./routes/nurseProfile');
const nurseBookingsRoutes = require('./routes/nurseBookings');

connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// Serve uploaded files (nurse documents, etc.)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── Customer App Routes (Public) ────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/auth/phone', phoneAuthRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/blogs', blogRoutes);

// ── Customer App Routes (Protected) ────────────────────────────────────────
app.use('/api/bookings', bookingsRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/payments', paymentsRoutes);

// ── Nurse App Routes ────────────────────────────────────────────────────────
app.use('/api/nurse/auth', nurseAuthRoutes);       // OTP send/verify/resend for nurses
app.use('/api/nurse', nurseProfileRoutes);          // register, profile, document upload
app.use('/api/nurse/bookings', nurseBookingsRoutes); // booking lifecycle

app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'VytalYou API' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
