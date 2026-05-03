const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    society: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Society',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Document title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    fileUrl: {
      type: String,
      required: true, // URL from Cloudinary or S3
    },
    fileType: {
      type: String, // e.g., 'pdf', 'image'
    },
    category: {
      type: String,
      enum: ['society', 'personal'],
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    resident: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    isPublic: {
      type: Boolean,
      default: false, // If true, all society members can see it
    }
  },
  { timestamps: true }
);

documentSchema.index({ society: 1, category: 1 });
documentSchema.index({ resident: 1 });

module.exports = mongoose.model('Document', documentSchema);
