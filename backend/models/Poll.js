const mongoose = require('mongoose');

const pollSchema = new mongoose.Schema(
  {
    society: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Society',
      required: true,
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    question: {
      type: String,
      required: [true, 'Poll question is required'],
      trim: true,
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    options: [
      {
        text: { type: String, required: true },
        // Legacy polls only have this. New polls use voter tracking.
        votes: { type: Number, default: 0 },
        voterDetails: [
          {
            residentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            votedAt: { type: Date, default: Date.now }
          }
        ]
      }
    ],
    voters: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      }
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    }
  },
  { timestamps: true }
);

// Indexes for faster querying
pollSchema.index({ society: 1, isActive: 1 });
pollSchema.index({ expiresAt: 1 }); // Useful for chron jobs or TTL

module.exports = mongoose.model('Poll', pollSchema);
