const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'MedicalService', required: true },
    serviceTitle: { type: String, required: true },
    status: {
      type: String,
      enum: ['active', 'completed', 'cancelled'],
      default: 'active',
    },
    totalSessions: { type: Number, required: true },
    completedSessions: { type: Number, default: 0 },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
    },
    paymentId: { type: String },
    totalAmount: { type: Number, default: 0 },
    amountPaid: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Subscription', subscriptionSchema);
