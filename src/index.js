require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const authRoutes = require('./routes/auth');
const servicesRoutes = require('./routes/services');
const bookingsRoutes = require('./routes/bookings');
const phoneAuthRoutes = require('./routes/phoneAuth');
const profileRoutes = require('./routes/profile');

connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// Public
app.use('/api/auth', authRoutes);
app.use('/api/auth/phone', phoneAuthRoutes);
app.use('/api/services', servicesRoutes);

// Protected (bookings and profile require login)
app.use('/api/bookings', bookingsRoutes);
app.use('/api/profile', profileRoutes);

app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'VytalYou API' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
