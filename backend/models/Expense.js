const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    society: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Society',
      required: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'watchman_salary',
        'water_tanker',
        'cleaning_staff',
        'electricity',
        'lift_maintenance',
        'gardening',
        'security_system',
        'repairs',
        'miscellaneous',
      ],
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount must be non-negative'],
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    month: { type: Number },
    year: { type: Number },
    receipt: {
      url: String,
      publicId: String,
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    vendor: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Auto-set month/year from date
expenseSchema.pre('save', function (next) {
  if (this.date) {
    this.month = new Date(this.date).getMonth() + 1;
    this.year = new Date(this.date).getFullYear();
  }
  next();
});

expenseSchema.index({ year: 1, month: 1 });
expenseSchema.index({ category: 1 });

module.exports = mongoose.model('Expense', expenseSchema);
