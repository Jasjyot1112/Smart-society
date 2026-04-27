const express = require('express');
const router = express.Router();
const {
  getOverview, getRevenueTrend, getFacilityStats,
  getComplaintStats, getVisitorStats, getDefaulters,
} = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));

router.get('/overview', getOverview);
router.get('/revenue', getRevenueTrend);
router.get('/facilities', getFacilityStats);
router.get('/complaints', getComplaintStats);
router.get('/visitors', getVisitorStats);
router.get('/defaulters', getDefaulters);

module.exports = router;
