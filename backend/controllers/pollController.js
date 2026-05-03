const Poll = require('../models/Poll');
const User = require('../models/User');
const { logAction } = require('../services/auditService');

// @desc    Get all polls for society
// @route   GET /api/polls
const getPolls = async (req, res) => {
  const polls = await Poll.find({ society: req.user.society })
    .populate('creator', 'name')
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, count: polls.length, data: polls });
};

// @desc    Create a new poll (Admin)
// @route   POST /api/polls
const createPoll = async (req, res) => {
  const { question, options, daysActive, isAnonymous } = req.body;

  if (!options || options.length < 2) {
    return res.status(400).json({ success: false, message: 'Please provide at least 2 options' });
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (daysActive || 7));

  const pollOptions = options.map(opt => ({ text: opt, votes: 0 }));

  const poll = await Poll.create({
    society: req.user.society,
    creator: req.user._id,
    question,
    isAnonymous: isAnonymous || false,
    options: pollOptions,
    expiresAt,
  });

  await logAction(req.user._id, 'poll.created', 'Poll', poll._id, { question }, req);

  res.status(201).json({ success: true, data: poll });
};

// @desc    Vote on a poll (Resident)
// @route   POST /api/polls/:id/vote
const voteOnPoll = async (req, res) => {
  const { optionIndex } = req.body;
  const poll = await Poll.findById(req.params.id);

  if (!poll) return res.status(404).json({ success: false, message: 'Poll not found' });
  if (!poll.isActive || new Date() > poll.expiresAt) {
    return res.status(400).json({ success: false, message: 'This poll is closed' });
  }
  if (poll.voters.includes(req.user._id)) {
    return res.status(400).json({ success: false, message: 'You have already voted on this poll' });
  }
  if (optionIndex < 0 || optionIndex >= poll.options.length) {
    return res.status(400).json({ success: false, message: 'Invalid option selected' });
  }

  poll.options[optionIndex].votes += 1;
  if (!poll.options[optionIndex].voterDetails) {
    poll.options[optionIndex].voterDetails = [];
  }
  poll.options[optionIndex].voterDetails.push({ residentId: req.user._id, votedAt: Date.now() });
  poll.voters.push(req.user._id);
  await poll.save();

  res.status(200).json({ success: true, data: poll });
};

// @desc    Close a poll early (Admin)
// @route   PUT /api/polls/:id/close
const closePoll = async (req, res) => {
  const poll = await Poll.findById(req.params.id);
  if (!poll) return res.status(404).json({ success: false, message: 'Poll not found' });

  poll.isActive = false;
  await poll.save();

  await logAction(req.user._id, 'poll.closed', 'Poll', poll._id, { question: poll.question }, req);

  res.status(200).json({ success: true, data: poll });
};

// @desc    Get poll voters details (Admin)
// @route   GET /api/polls/:id/voters
const getVoters = async (req, res) => {
  const poll = await Poll.findById(req.params.id)
    .populate('options.voterDetails.residentId', 'name flatNumber wing phone')
    .lean();

  if (!poll) return res.status(404).json({ success: false, message: 'Poll not found' });

  const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0);

  const options = poll.options.map(opt => {
    // Admin always sees full voter details regardless of isAnonymous.
    // isAnonymous only hides identities from OTHER residents, not from admin.
    const votersList = (opt.voterDetails || []).map(v => ({
      name: v.residentId?.name || 'Unknown User',
      flatNumber: v.residentId?.wing
        ? `${v.residentId.wing}-${v.residentId?.flatNumber}`
        : v.residentId?.flatNumber,
      phone: v.residentId?.phone,
      votedAt: v.votedAt
    }));
    return {
      text: opt.text,
      voteCount: opt.votes,
      percentage: totalVotes === 0 ? 0 : Math.round((opt.votes / totalVotes) * 100),
      voters: votersList.sort((a, b) => new Date(b.votedAt) - new Date(a.votedAt))
    };
  });

  const allResidents = await User.find({ society: req.user.society, role: 'resident', isActive: true })
    .select('name flatNumber wing phone')
    .lean();
  
  const votedUserIds = (poll.voters || []).map(id => id.toString());
  const notVoted = allResidents
    .filter(r => !votedUserIds.includes(r._id.toString()))
    .map(r => ({
      name: r.name,
      flatNumber: r.wing ? `${r.wing}-${r.flatNumber}` : r.flatNumber,
      phone: r.phone
    }));

  res.status(200).json({
    success: true,
    data: {
      pollTitle: poll.question,
      totalVotes,
      isAnonymous: poll.isAnonymous,
      options,
      notVoted
    }
  });
};

module.exports = { getPolls, createPoll, voteOnPoll, closePoll, getVoters };
