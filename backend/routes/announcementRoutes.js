const express = require('express');
const router = express.Router();
const {
  createAnnouncement, getAnnouncements, deleteAnnouncement
} = require('../controllers/announcementController');
const { protect, authorize } = require('../middleware/auth');
const { uploadAnnouncementImage } = require('../config/cloudinary');

router.use(protect);

router.post('/', authorize('admin'), uploadAnnouncementImage.single('image'), createAnnouncement);
router.get('/', getAnnouncements);
router.delete('/:id', authorize('admin'), deleteAnnouncement);

module.exports = router;
