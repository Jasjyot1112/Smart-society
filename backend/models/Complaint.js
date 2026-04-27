const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
  url: { type: String, required: true },
  publicId: { type: String },
  type: { type: String, enum: ['image', 'audio'], required: true },
});

const timelineSchema = new mongoose.Schema({
  status: { type: String },
  note: { type: String },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedAt: { type: Date, default: Date.now },
});

const complaintSchema = new mongoose.Schema(
  {
    society: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Society',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    category: {
      type: String,
      enum: ['electrical', 'plumbing', 'security', 'cleanliness', 'noise', 'lift', 'parking', 'common_area', 'other'],
      default: 'other',
    },
    priority: {
      type: String,
      enum: ['urgent', 'high', 'normal', 'low'],
      default: 'normal',
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'resolved', 'rejected', 'closed'],
      default: 'pending',
    },
    media: [mediaSchema],
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    resolvedAt: Date,
    timeline: [timelineSchema],
    isAutoClassified: {
      type: Boolean,
      default: false,
    },
    flatNumber: { type: String },
    wing: { type: String },
    rating: { type: Number, min: 1, max: 5 },
    feedback: { type: String },
  },
  { timestamps: true }
);

// Full-text search index
complaintSchema.index({ title: 'text', description: 'text' });
complaintSchema.index({ user: 1, createdAt: -1 });
complaintSchema.index({ status: 1, priority: 1 });

module.exports = mongoose.model('Complaint', complaintSchema);
