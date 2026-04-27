const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema(
  {
    society: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Society',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['admin', 'resident', 'security'],
      default: 'resident',
    },
    phone: {
      type: String,
      match: [/^[6-9]\d{9}$/, 'Please enter a valid Indian phone number'],
    },
    flatNumber: { type: String, trim: true },
    wing: { type: String, trim: true },
    profilePic: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    lastLogin: Date,

    // Refresh token (hashed)
    refreshToken: { type: String, select: false },

    // Login history - last 5 sessions
    loginHistory: {
      type: [
        {
          ip: String,
          userAgent: String,
          timestamp: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Match password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Sign short-lived access JWT (15 min in prod, 7d in dev)
userSchema.methods.getSignedJwtToken = function () {
  const expiresIn = process.env.NODE_ENV === 'production' ? '15m' : (process.env.JWT_EXPIRE || '7d');
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn }
  );
};

// Sign long-lived refresh token (7 days)
userSchema.methods.getRefreshToken = function () {
  return jwt.sign(
    { id: this._id },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh',
    { expiresIn: '7d' }
  );
};

// Virtual full address
userSchema.virtual('address').get(function () {
  return this.wing ? `${this.wing}-${this.flatNumber}` : this.flatNumber;
});

module.exports = mongoose.model('User', userSchema);
