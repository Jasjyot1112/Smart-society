const express = require('express');
const router = express.Router();
const {
  createComplaint, getMyComplaints, getAllComplaints, getComplaint,
  updateComplaintStatus, rateComplaint, getComplaintStats,
} = require('../controllers/complaintController');
const { protect, authorize } = require('../middleware/auth');
const { uploadComplaintMedia } = require('../config/cloudinary');

router.use(protect);

router.post('/', authorize('resident'), uploadComplaintMedia.array('media', 3), createComplaint);
router.get('/my', authorize('resident'), getMyComplaints);
router.get('/stats', authorize('admin'), getComplaintStats);
router.get('/', authorize('admin'), getAllComplaints);
router.get('/:id', getComplaint);
router.put('/:id/status', authorize('admin'), updateComplaintStatus);
router.put('/:id/rate', authorize('resident'), rateComplaint);

module.exports = router;
