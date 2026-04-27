const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    society: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Society',
      required: true,
    },
    facility: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Facility',
      required: [true, 'Facility is required'],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    date: {
      type: Date,
      required: [true, 'Booking date is required'],
    },
    slot: {
      startTime: { type: String, required: true },
      endTime: { type: String, required: true },
      label: { type: String },
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed', 'no_show'],
      default: 'confirmed',
    },
    notes: {
      type: String,
      maxlength: [300, 'Notes cannot exceed 300 characters'],
    },
    cancelledAt: Date,
    cancelReason: String,
    checkedIn: { type: Boolean, default: false },

    // Waitlist: users waiting for this slot if it frees up
    waitlist: {
      type: [
        {
          user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
          requestedAt: { type: Date, default: Date.now },
          notified: { type: Boolean, default: false },
        },
      ],
      default: [],
    },

    // Auto-cancel deadline for pending bookings
    paymentDeadline: { type: Date },

    // Concurrency lock flag (set during atomic operations)
    isProcessing: { type: Boolean, default: false, select: false },
  },
  { timestamps: true }
);

// Index for fast conflict checking
bookingSchema.index({ facility: 1, date: 1, 'slot.startTime': 1, status: 1 });
// Index for user history
bookingSchema.index({ user: 1, date: -1 });
// Index for auto-cancel scheduler
bookingSchema.index({ status: 1, createdAt: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
