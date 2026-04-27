const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
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
    action: {
      type: String,
      required: true,
      // e.g., 'booking.created', 'booking.cancelled', 'payment.success',
      //        'visitor.approved', 'visitor.entered', 'complaint.updated'
    },
    entity: {
      type: String,
      required: true,
      enum: ['Booking', 'Payment', 'Visitor', 'Complaint', 'Facility', 'User', 'Expense'],
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    changes: {
      type: mongoose.Schema.Types.Mixed, // { field: { from, to } }
      default: {},
    },
    description: { type: String },
    ip: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true }
);

// Indexes for efficient querying
auditLogSchema.index({ user: 1, createdAt: -1 });
auditLogSchema.index({ entity: 1, entityId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
