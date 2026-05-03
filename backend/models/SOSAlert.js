const mongoose = require('mongoose');

const sosAlertSchema = new mongoose.Schema(
  {
    society: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Society',
      required: true,
    },
    resident: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    flatNumber: { type: String, required: true },
    wing: { type: String },
    type: {
      type: String,
      enum: ['medical', 'fire', 'security', 'other'],
      default: 'other',
    },
    message: { type: String },
    status: {
      type: String,
      enum: ['active', 'acknowledged', 'resolved'],
      default: 'active',
    },
    acknowledgedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    acknowledgedAt: { type: Date },
    resolvedAt: { type: Date },
    resolutionNotes: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SOSAlert', sosAlertSchema);
