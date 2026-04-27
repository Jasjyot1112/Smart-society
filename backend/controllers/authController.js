const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });
  if (!user.isActive) return res.status(401).json({ success: false, message: 'Account deactivated. Contact admin.' });

  const isMatch = await user.matchPassword(password);
  if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });

  // Access + refresh tokens
  const token = user.getSignedJwtToken();
  const refreshToken = user.getRefreshToken();

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
    return res.status(401).json({ success: false, message: 'Refresh token expired or invalid' });
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

module.exports = { register, login, refresh, logout, getMe, changePassword, updateProfile };
