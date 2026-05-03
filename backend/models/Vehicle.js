const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema(
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
    licensePlate: {
      type: String,
      required: [true, 'License plate is required'],
      trim: true,
      uppercase: true,
    },
    type: {
      type: String,
      enum: ['2-wheeler', '4-wheeler', 'other'],
      required: true,
    },
    makeModel: { type: String }, // e.g. "Honda City"
    color: { type: String },
    parkingSpotNumber: { type: String }, // Optional assigned spot
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

vehicleSchema.index({ society: 1, licensePlate: 1 });
vehicleSchema.index({ resident: 1 });

module.exports = mongoose.model('Vehicle', vehicleSchema);
