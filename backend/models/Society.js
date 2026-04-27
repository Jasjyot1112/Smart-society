const mongoose = require('mongoose');

const societySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Society name is required'],
      trim: true,
      unique: true,
    },
    address: {
      type: String,
      required: [true, 'Society address is required'],
    },
    registrationNumber: {
      type: String,
      trim: true,
    },
    adminEmail: {
      type: String,
    },
    subscriptionPlan: {
      type: String,
      enum: ['basic', 'premium', 'enterprise'],
      default: 'premium',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    maintenanceBaseAmount: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: 'INR',
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Society', societySchema);
