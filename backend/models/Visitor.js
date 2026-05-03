const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema(
  {
    society: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Society',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Visitor name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
    },
    purpose: {
      type: String,
      enum: ['delivery', 'guest', 'service', 'cab', 'maintenance', 'worker', 'pre_approved', 'other'],
      default: 'guest',
    },
    flatNumber: {
      type: String,
      required: [true, 'Flat number is required'],
    },
    wing: { type: String },
    resident: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    guard: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'denied', 'entered', 'exited', 'expired'],
      default: 'pending',
    },
    otp: {
      code: { type: String },
      expiresAt: { type: Date },
      isUsed: { type: Boolean, default: false },
    },
    otpDeliveryMethod: { 
      type: String, 
      enum: ['whatsapp', 'sms', 'app', 'none'], 
      default: 'app' 
    },
    qrCode: {
      type: String, // base64 or URL
    },
    qrToken: {
      type: String,
    },
    entryTime: { type: Date },
    exitTime: { type: Date },
    photo: { type: String },
    vehicleNumber: { type: String },
    notes: { type: String },
    approvedAt: { type: Date },
    deniedAt: { type: Date },
    denialReason: { type: String },
    preApproved: { type: Boolean, default: false },
    preApprovedUntil: { type: Date },
    auditLog: [
      {
        action: String,
        performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        timestamp: { type: Date, default: Date.now },
        notes: String,
      },
    ],
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Virtual for duration in minutes
visitorSchema.virtual('duration').get(function () {
  if (this.entryTime && this.exitTime) {
    return Math.round((this.exitTime - this.entryTime) / 60000);
  }
  return null;
});

visitorSchema.index({ resident: 1, createdAt: -1 });
visitorSchema.index({ guard: 1, createdAt: -1 });
visitorSchema.index({ status: 1 });
visitorSchema.index({ flatNumber: 1 });

module.exports = mongoose.model('Visitor', visitorSchema);
