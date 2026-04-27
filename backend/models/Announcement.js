const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema(
  {
    society: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Society',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    type: {
      type: String,
      enum: ['event', 'notice', 'emergency'],
      default: 'notice',
    },
    image: {
      url: { type: String },
      publicId: { type: String },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

announcementSchema.index({ society: 1, type: 1, createdAt: -1 });

module.exports = mongoose.model('Announcement', announcementSchema);
