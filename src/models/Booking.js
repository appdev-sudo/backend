const mongoose = require('mongoose');

// ── Admin Chart (vitals recorded during service) ────────────────────────────
const adminChartSchema = new mongoose.Schema(
  {
    bloodPressure: { type: String },   // e.g. "120/80 mmHg"
    heartRate: { type: Number },       // bpm
    spo2: { type: Number },            // %
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

// ── Expense ─────────────────────────────────────────────────────────────────
const expenseSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['Therapeutic', 'Non-Therapeutic'], required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    receiptUrl: { type: String }, // Optional image of the receipt/invoice
    addedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

// ── Main Booking Schema ─────────────────────────────────────────────────────
const bookingSchema = new mongoose.Schema(
  {
    // Existing fields (customer-facing)
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'MedicalService', required: false },
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
    adminNote: { type: String },

    // Subscription tracking fields
    isSubscriptionSession: { type: Boolean, default: false },
    parentSubscription: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription' },
    sessionName: { type: String },
    sessionOrder: { type: Number },
    locationType: { type: String, enum: ['home', 'clinic'], default: 'home' },
    clinicLocation: { type: String, enum: ['Vytalyou Powai', 'Vytalyou Juhu', 'Vytalyou Worli'] },

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
    checklist: { type: mongoose.Schema.Types.Mixed },
    inventory: [inventoryItemSchema],
    adminCharts: [adminChartSchema],
    expenses: [expenseSchema],
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
