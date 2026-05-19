/**
 * Nurse authentication middleware.
 * Verifies JWT and loads the Nurse document (not User).
 * The JWT contains { nurseId, phone } instead of { userId, phone }.
 */
const jwt = require('jsonwebtoken');
const Nurse = require('../models/Nurse');

const nurseAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. Please log in.' });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Support both nurseId and userId in the token
    // (during initial OTP verification, the token has nurseId)
    const nurse = await Nurse.findById(decoded.nurseId || decoded.userId);
    if (!nurse) {
      return res.status(401).json({ error: 'Nurse account not found.' });
    }

    req.nurse = nurse;
    req.nurseId = nurse._id;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid or expired token. Please log in again.' });
    }
    console.error('Nurse auth middleware error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

module.exports = nurseAuth;
