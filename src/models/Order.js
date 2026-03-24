const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Cashfree fields
    orderId: { type: String, required: true, unique: true },       // Cashfree order_id
    cfOrderId: { type: String },                                    // Cashfree cf_order_id
    paymentSessionId: { type: String },                             // session ID for SDK
    // Amount
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    // Customer snapshot
    customerName: { type: String },
    customerPhone: { type: String },
    customerEmail: { type: String },
    // Status tracking
    orderStatus: {
      type: String,
      enum: ['CREATED', 'PAYMENT_PENDING', 'PAID', 'FAILED', 'REFUNDED'],
      default: 'CREATED',
    },
    // Payment details (filled after verification)
    paymentId: { type: String },          // cf_payment_id
    paymentMethod: { type: String },      // e.g. "upi", "card", "nb"
    paymentTime: { type: Date },
    // Link to booking (filled after booking is created)
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  },
  { timestamps: true }
);

orderSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
