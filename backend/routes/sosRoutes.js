const express = require('express');
const router = express.Router();
const {
  createAlert,
  acknowledgeAlert,
  resolveAlert,
  getActiveAlerts,
  getHistory,
} = require('../controllers/sosController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.post('/', authorize('resident'), createAlert);
router.get('/active', authorize('admin', 'security'), getActiveAlerts);
router.get('/history', authorize('admin', 'security'), getHistory);
router.put('/:id/acknowledge', authorize('admin', 'security'), acknowledgeAlert);
router.put('/:id/resolve', authorize('admin', 'security'), resolveAlert);

module.exports = router;
