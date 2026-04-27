const express = require('express');
const router = express.Router();
const {
  createOrder, verifyPayment, downloadInvoice, getMyPayments, getAllPayments, getDefaulters, sendReminders,
} = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.post('/order', authorize('resident'), createOrder);
router.post('/verify', authorize('resident'), verifyPayment);
router.get('/history', authorize('resident'), getMyPayments);
router.get('/:id/invoice', downloadInvoice); // accessible by resident or admin
router.get('/', authorize('admin'), getAllPayments);
router.get('/defaulters', authorize('admin'), getDefaulters);
router.post('/remind', authorize('admin'), sendReminders);

module.exports = router;
