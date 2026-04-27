const express = require('express');
const router = express.Router();
const {
  getFacilities, getFacility, createFacility, updateFacility, deleteFacility,
  getCalendarData, createBooking, getMyBookings, getAllBookings, cancelBooking, getSlotSuggestions,
} = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// Facility routes
router.get('/facilities', getFacilities);
router.get('/facilities/:id', getFacility);
router.post('/facilities', authorize('admin'), createFacility);
router.put('/facilities/:id', authorize('admin'), updateFacility);
router.delete('/facilities/:id', authorize('admin'), deleteFacility);

// Booking routes
router.post('/', authorize('resident'), createBooking);
router.get('/my', authorize('resident'), getMyBookings);
router.get('/all', authorize('admin'), getAllBookings);
router.put('/:id/cancel', authorize('resident', 'admin'), cancelBooking);
router.get('/calendar/:facilityId', getCalendarData);
router.get('/suggestions/:facilityId', getSlotSuggestions);

module.exports = router;
