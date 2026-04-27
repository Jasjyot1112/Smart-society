const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    society: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Society',
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: [
        'visitor_request',
        'visitor_approved',
        'visitor_denied',
        'booking_confirmed',
        'booking_cancelled',
        'complaint_update',
        'payment_due',
        'payment_success',
        'general',
      ],
      default: 'general',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    link: {
      type: String, // Frontend route to navigate to
    },
    relatedId: {
      type: mongoose.Schema.Types.ObjectId, // Related document ID
    },
    relatedModel: {
      type: String, // 'Visitor', 'Booking', 'Complaint', etc.
    },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
