const mongoose = require('mongoose');

const marketplaceItemSchema = new mongoose.Schema(
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
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    category: {
      type: String,
      enum: ['Furniture', 'Electronics', 'Appliances', 'Vehicles', 'Other'],
      required: true,
    },
    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String }, // For Cloudinary
      },
    ],
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    contactInfo: {
      phone: { type: String },
      email: { type: String },
      showContact: { type: Boolean, default: true },
    },
    status: {
      type: String,
      enum: ['available', 'sold'],
      default: 'available',
    },
  },
  { timestamps: true }
);

// Index for search & filtering
marketplaceItemSchema.index({ society: 1, status: 1, category: 1 });
marketplaceItemSchema.index({ title: 'text', description: 'text' });
marketplaceItemSchema.index({ sellerId: 1 });

module.exports = mongoose.model('MarketplaceItem', marketplaceItemSchema);
