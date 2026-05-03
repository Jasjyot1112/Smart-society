const express = require('express');
const router = express.Router();
const { getPolls, createPoll, voteOnPoll, closePoll, getVoters } = require('../controllers/pollController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', authorize('admin', 'resident'), getPolls);
router.post('/', authorize('admin'), createPoll);
router.post('/:id/vote', authorize('resident'), voteOnPoll);
router.put('/:id/close', authorize('admin'), closePoll);
router.get('/:id/voters', authorize('admin'), getVoters);

module.exports = router;
