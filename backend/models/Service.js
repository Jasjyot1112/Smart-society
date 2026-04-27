const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    society: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Society',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Service/Provider name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    contact: {
      type: String,
      required: [true, 'Contact information is required'],
    },
    category: {
      type: String,
      enum: ['Milk', 'Newspaper', 'Maid', 'Electrician', 'Plumber', 'Internet', 'Other'],
      required: true,
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

serviceSchema.index({ society: 1, category: 1 });

module.exports = mongoose.model('Service', serviceSchema);
