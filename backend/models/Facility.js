const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  startTime: { type: String, required: true }, // e.g. "09:00"
  endTime: { type: String, required: true },   // e.g. "10:00"
  label: { type: String },                     // e.g. "9 AM - 10 AM"
});

const facilitySchema = new mongoose.Schema(
  {
    society: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Society',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Facility name is required'],
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['turf', 'table_tennis', 'lawn', 'event_hall', 'swimming_pool', 'gym', 'other'],
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    slots: [slotSchema],
    maxBookingsPerWeek: {
      type: Number,
      default: 3,
    },
    capacity: {
      type: Number,
      default: 1,
    },
    pricePerSlot: {
      type: Number,
      default: 0,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    unavailableDates: [{ type: Date }],
    image: {
      type: String,
      default: '',
    },
    rules: [{ type: String }],
    location: {
      type: String,
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Facility', facilitySchema);
