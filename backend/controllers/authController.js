const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendEmail } = require('../services/emailService');

const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh';

// @desc    Register user (Admin only in production)
// @route   POST /api/auth/register
const register = async (req, res) => {
  const { name, email, password, role, phone, flatNumber, wing, societyId } = req.body;

  // Assign to provided society or default Genesis Society
  let society = societyId;
  if (!society) {
    const Society = require('../models/Society');
    const defaultSociety = await Society.findOne({ name: 'Genesis Society' });
    if (defaultSociety) society = defaultSociety._id;
  }

  const user = await User.create({ name, email, password, role, phone, flatNumber, wing, society });
  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: { _id: user._id, name: user.name, email: user.email, role: user.role },
  });
};

// @desc    Login user — returns access + refresh tokens
// @route   POST /api/auth/login
const login = async (req, res) => {
  const { email, password, rememberMe } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });
  if (!user.isActive) return res.status(401).json({ success: false, message: 'Account deactivated. Contact admin.' });

  const isMatch = await user.matchPassword(password);
  if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });

  // Access + refresh tokens — pass rememberMe to extend refresh token to 30d
  const token = user.getSignedJwtToken();
  const refreshToken = user.getRefreshToken(!!rememberMe);

  // Hash and store refresh token
  const hashedRefresh = await bcrypt.hash(refreshToken, 10);

  // Update login history (keep last 5)
  const historyEntry = {
    ip: req.ip || req.connection?.remoteAddress,
    userAgent: req.headers['user-agent']?.substring(0, 200),
    timestamp: new Date(),
  };
  const history = [...(user.loginHistory || []), historyEntry].slice(-5);

  await User.findByIdAndUpdate(user._id, {
    lastLogin: new Date(),
    refreshToken: hashedRefresh,
    loginHistory: history,
  });

  res.status(200).json({
    success: true,
    token,
    refreshToken,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      flatNumber: user.flatNumber,
      wing: user.wing,
      profilePic: user.profilePic,
      preferredLanguage: user.preferredLanguage,
    },
  });
};

// @desc    Refresh access token using refresh token
// @route   POST /api/auth/refresh
const refresh = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ success: false, message: 'Refresh token required' });

  try {
    const decoded = jwt.verify(refreshToken, REFRESH_SECRET);
    const user = await User.findById(decoded.id).select('+refreshToken');

    if (!user || !user.refreshToken) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }

    // Verify stored hash
    const isValid = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!isValid) return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    if (!user.isActive) return res.status(401).json({ success: false, message: 'Account deactivated' });

    // Issue new tokens (token rotation)
    const newToken = user.getSignedJwtToken();
    const newRefresh = user.getRefreshToken();
    const hashedRefresh = await bcrypt.hash(newRefresh, 10);
    await User.findByIdAndUpdate(user._id, { refreshToken: hashedRefresh });

    res.status(200).json({ success: true, token: newToken, refreshToken: newRefresh });
  } catch {
    return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
  }
};

// @desc    Logout — invalidate refresh token
// @route   POST /api/auth/logout
const logout = async (req, res) => {
  if (req.user) {
    await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
  }
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};

// @desc    Get current user profile
// @route   GET /api/auth/me
const getMe = async (req, res) => {
  const user = await User.findById(req.user._id);
  res.status(200).json({ success: true, data: user });
};

// @desc    Change password
// @route   PUT /api/auth/change-password
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');
  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) return res.status(400).json({ success: false, message: 'Current password is incorrect' });
  user.password = newPassword;
  user.refreshToken = null; // Invalidate all sessions on password change
  await user.save();
  res.status(200).json({ success: true, message: 'Password updated. Please log in again.' });
};

// @desc    Update profile
// @route   PUT /api/auth/profile
const updateProfile = async (req, res) => {
  const allowedFields = ['name', 'phone'];
  const updates = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });
  if (req.file) updates.profilePic = req.file.path;
  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
  res.status(200).json({ success: true, data: user });
};

// @desc    Forgot Password — send OTP to email
// @route   POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

  const user = await User.findOne({ email: email.toLowerCase() });

  // Always respond with success to prevent email enumeration
  if (!user) {
    return res.status(200).json({
      success: true,
      message: 'If an account with this email exists, an OTP has been sent.',
    });
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedOTP = await bcrypt.hash(otp, 10);
  const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  await User.findByIdAndUpdate(user._id, {
    resetPasswordOTP: hashedOTP,
    resetPasswordOTPExpire: expiry,
  });

  // Send OTP email
  await sendEmail({
    to: user.email,
    subject: '[Smart Society] Password Reset OTP',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 28px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 22px;">🔐 Password Reset</h1>
        </div>
        <div style="padding: 28px; background: #f8fafc; border-radius: 0 0 10px 10px;">
          <p style="color: #374151;">Hi <strong>${user.name}</strong>,</p>
          <p style="color: #374151;">Use this OTP to reset your Smart Society password:</p>
          <div style="text-align: center; margin: 28px 0;">
            <div style="background: #1e293b; display: inline-block; padding: 16px 32px; border-radius: 10px; letter-spacing: 10px; font-size: 32px; font-weight: 700; color: #818cf8; font-family: monospace;">
              ${otp}
            </div>
          </div>
          <p style="color: #ef4444; font-size: 14px;">⚠️ This OTP expires in 15 minutes. Do not share it with anyone.</p>
          <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">If you did not request this, please ignore this email. Your password will remain unchanged.</p>
        </div>
      </div>
    `,
  });

  res.status(200).json({
    success: true,
    message: 'If an account with this email exists, an OTP has been sent.',
  });
};

// @desc    Reset Password using OTP
// @route   POST /api/auth/reset-password
const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return res.status(400).json({ success: false, message: 'Email, OTP, and new password are required' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
  }

  const user = await User.findOne({
    email: email.toLowerCase(),
    resetPasswordOTPExpire: { $gt: new Date() },
  }).select('+resetPasswordOTP');

  if (!user || !user.resetPasswordOTP) {
    return res.status(400).json({ success: false, message: 'OTP is invalid or has expired. Please request a new one.' });
  }

  const isOTPValid = await bcrypt.compare(otp.trim(), user.resetPasswordOTP);
  if (!isOTPValid) {
    return res.status(400).json({ success: false, message: 'Invalid OTP. Please check and try again.' });
  }

  // Update password and clear OTP fields
  user.password = newPassword;
  user.resetPasswordOTP = undefined;
  user.resetPasswordOTPExpire = undefined;
  user.refreshToken = null; // Invalidate all active sessions
  await user.save();

  res.status(200).json({ success: true, message: 'Password reset successfully. Please log in with your new password.' });
};

// @desc    Update preferred language
// @route   PATCH /api/auth/language
const updateLanguage = async (req, res) => {
  const { language } = req.body;
  const allowed = ['en', 'mr', 'hi'];
  if (!allowed.includes(language)) {
    return res.status(400).json({ success: false, message: 'Invalid language code. Allowed: en, mr, hi' });
  }
  await User.findByIdAndUpdate(req.user._id, { preferredLanguage: language });
  res.status(200).json({ success: true, message: 'Language preference saved', language });
};

module.exports = {
  register, login, refresh, logout, getMe, changePassword, updateProfile,
  forgotPassword, resetPassword, updateLanguage,
};
