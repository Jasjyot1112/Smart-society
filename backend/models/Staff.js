const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema(
  {
    society: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Society',
      required: true,
    },
    // Auto-generated unique ID e.g. SS-2026-001
    staffId: {
      type: String,
    },
    // QR code as base64 data URL (generated on creation)
    qrCode: {
      type: String,
    },
    name: {
      type: String,
      required: [true, 'Staff name is required'],
      trim: true,
    },
    // Society-level roles only — NOT resident-specific staff like personal maids
    role: {
      type: String,
      required: [true, 'Staff role is required'],
      enum: ['cleaner', 'gardener', 'sweeper', 'security_guard', 'maintenance', 'lift_operator', 'garbage_collector', 'housekeeping', 'plumber', 'electrician', 'other'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
    },
    photo: {
      type: String,
    },
    // Work area assigned in the society
    workArea: {
      type: String,
      default: 'General',
      // e.g. "Garden", "Club House", "Floors 1-5", "Garbage Collection", "Common Areas"
    },
    // Daily salary in INR
    dailySalary: {
      type: Number,
      default: 0,
    },
    joiningDate: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    attendance: [
      {
        date: { type: Date, required: true },
        checkIn: { type: Date },
        checkOut: { type: Date },
        checkedInBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        checkedOutBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      }
    ],
    status: {
      type: String,
      enum: ['inside', 'outside'],
      default: 'outside',
    }
  },
  { timestamps: true }
);

staffSchema.index({ society: 1, isActive: 1 });
staffSchema.index({ staffId: 1 }, { unique: true, sparse: true });
staffSchema.index({ 'attendance.date': 1 });

module.exports = mongoose.model('Staff', staffSchema);

