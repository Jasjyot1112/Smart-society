const express = require('express');
const router = express.Router();
const {
  createEvent, getEvents, rsvpEvent, deleteEvent
} = require('../controllers/eventController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.post('/', authorize('admin'), createEvent);
router.get('/', getEvents);
router.post('/:id/rsvp', rsvpEvent);
router.delete('/:id', authorize('admin'), deleteEvent);

module.exports = router;
