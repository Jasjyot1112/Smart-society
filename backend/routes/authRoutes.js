const express = require('express');
const router = express.Router();
const { register, login, getMe, changePassword, updateProfile } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');
const { uploadProfile } = require('../config/cloudinary');

router.post('/register', protect, authorize('admin'), register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/change-password', protect, changePassword);
router.put('/profile', protect, uploadProfile.single('profilePic'), updateProfile);

module.exports = router;
