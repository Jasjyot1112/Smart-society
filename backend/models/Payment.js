const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    society: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Society',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [1, 'Amount must be positive'],
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    razorpayOrderId: {
      type: String,
    },
    razorpayPaymentId: {
      type: String,
    },
    razorpaySignature: {
      type: String,
    },
    receipt: {
      type: String,
    },
    paidAt: {
      type: Date,
    },
    description: {
      type: String,
      default: 'Monthly Maintenance',
    },
    lateFee: {
      type: Number,
      default: 0,
    },
    flatNumber: { type: String },
    wing: { type: String },
  },
  { timestamps: true }
);

// Unique payment per user per month/year
paymentSchema.index({ user: 1, month: 1, year: 1 }, { unique: true });
paymentSchema.index({ status: 1 });
paymentSchema.index({ year: 1, month: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
