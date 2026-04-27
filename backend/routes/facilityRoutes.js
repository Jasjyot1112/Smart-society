const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const bookingController = require('../controllers/bookingController');

// All facility routes require authentication for society scoping
router.use(protect);

router.get('/', bookingController.getFacilities);
router.get('/:id', bookingController.getFacility);
router.post('/', authorize('admin'), bookingController.createFacility);
router.put('/:id', authorize('admin'), bookingController.updateFacility);
router.delete('/:id', authorize('admin'), bookingController.deleteFacility);

module.exports = router;
