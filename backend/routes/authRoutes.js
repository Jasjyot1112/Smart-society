const express = require('express');
const router = express.Router();
const {
  register, login, refresh, logout, getMe, changePassword,
  updateProfile, forgotPassword, resetPassword, updateLanguage,
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');
const { uploadProfile } = require('../config/cloudinary');

// Public routes
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes
router.use(protect);
router.post('/register', authorize('admin'), register);
router.post('/logout', logout);
router.get('/me', getMe);
router.put('/change-password', changePassword);
router.put('/profile', uploadProfile.single('profilePic'), updateProfile);
router.patch('/language', updateLanguage);

module.exports = router;
