const mongoose = require('mongoose');

// ── Admin Chart (vitals recorded during service) ────────────────────────────
const adminChartSchema = new mongoose.Schema(
  {
    bloodPressure: { type: String },   // e.g. "120/80 mmHg"
    heartRate: { type: Number },       // bpm
    temperature: { type: Number },     // °F
    spo2: { type: Number },            // %
    weight: { type: Number },          // kg
    notes: { type: String, default: '' },
    recordedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

// ── Nurse Feedback ──────────────────────────────────────────────────────────
const nurseFeedbackSchema = new mongoose.Schema(
  {
    rating: { type: Number, min: 1, max: 5 },
    comments: { type: String, default: '' },
    submittedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

// ── Inventory Item ──────────────────────────────────────────────────────────
const inventoryItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    quantity: { type: Number, default: 1 },
    unit: { type: String, default: 'pcs' },
    isAvailable: { type: Boolean, default: true },
  },
  { _id: false }
);

// ── Main Booking Schema ─────────────────────────────────────────────────────
const bookingSchema = new mongoose.Schema(
  {
    // Existing fields (customer-facing)
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'MedicalService', required: true },
    serviceId: { type: String, required: true },
    serviceTitle: { type: String, required: true },
    preferredDate: { type: Date },
    preferredTimeSlot: { type: String },
    address: {
      street: { type: String },
      landmark: { type: String },
      city: { type: String },
      state: { type: String },
      pincode: { type: String },
      country: { type: String },
      formattedAddress: { type: String },
    },
    notes: { type: String },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'assigned', 'accepted', 'in_progress', 'completed', 'cancelled', 'rejected'],
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
    },
    paymentId: { type: String },

    // ── Nurse-specific fields ─────────────────────────────────────────────
    nurse: { type: mongoose.Schema.Types.ObjectId, ref: 'Nurse' },
    rejectedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Nurse' }], // nurses who rejected

    // OTP gates
    startOtp: { type: String },         // 6-digit code for starting service
    endOtp: { type: String },           // 6-digit code for ending service
    startedAt: { type: Date },
    completedAt: { type: Date },

    // Service execution
    inventory: [inventoryItemSchema],
    adminChart: adminChartSchema,
    consentSigned: { type: Boolean, default: false },
    consentSignatureData: { type: String },  // base64 or URL
    feedback: nurseFeedbackSchema,

    // Rejection reason
    rejectionReason: { type: String },
  },
  { timestamps: true }
);

bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ nurse: 1, status: 1 });
bookingSchema.index({ status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
