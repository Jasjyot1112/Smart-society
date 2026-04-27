const express = require('express');
const router = express.Router();
const {
  preApproveVisitor,
  createVisitorRequest,
  respondToVisitor,
  verifyQRCode,
  markExit,
  getVisitors,
  getVisitor,
} = require('../controllers/visitorController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.post('/pre-approve', authorize('resident'), preApproveVisitor);
router.post('/', authorize('security'), createVisitorRequest);
router.put('/:id/respond', authorize('resident'), respondToVisitor);
router.post('/verify-qr', authorize('security'), verifyQRCode);
router.put('/:id/exit', authorize('security'), markExit);
router.get('/', getVisitors);
router.get('/:id', getVisitor);

module.exports = router;
