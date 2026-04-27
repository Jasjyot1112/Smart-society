const Complaint = require('../models/Complaint');
const { classifyComplaint } = require('../services/nlpService');
const { createNotification, notifyAdmins } = require('../services/notificationService');
const { sendComplaintUpdate } = require('../services/emailService');
const User = require('../models/User');

// @desc    Create complaint
// @route   POST /api/complaints
const createComplaint = async (req, res) => {
  const { title, description } = req.body;
  const user = req.user;

  // Auto-classify using NLP
  const { category, priority } = classifyComplaint(title, description);

  const media = [];
  if (req.files && req.files.length > 0) {
    req.files.forEach((file) => {
      media.push({
        url: file.path,
        publicId: file.filename,
        type: file.mimetype.startsWith('audio') ? 'audio' : 'image',
      });
    });
  }

  const complaint = await Complaint.create({ society: req.user.society,
    user: user._id,
    title,
    description,
    category,
    priority,
    media,
    flatNumber: user.flatNumber,
    wing: user.wing,
    isAutoClassified: true,
    timeline: [{ status: 'pending', note: 'Complaint submitted', updatedBy: user._id }],
  });

  await complaint.populate('user', 'name flatNumber wing');

  // Notify admins
  await notifyAdmins(User, {
    title: `New ${priority.toUpperCase()} Complaint`,
    message: `${user.name} raised a complaint: "${title}"`,
    type: 'complaint_update',
    link: '/admin/complaints',
    relatedId: complaint._id,
    relatedModel: 'Complaint',
  });

  res.status(201).json({ success: true, data: complaint });
};

// @desc    Get my complaints
// @route   GET /api/complaints/my
const getMyComplaints = async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;
  const query = { user: req.user._id };
  if (status) query.status = status;

  const complaints = await Complaint.find(query)
    .populate('assignedTo', 'name')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const count = await Complaint.countDocuments(query);
  res.status(200).json({ success: true, count, pages: Math.ceil(count / limit), data: complaints });
};

// @desc    Get all complaints (Admin)
// @route   GET /api/complaints
const getAllComplaints = async (req, res) => {
  const { status, priority, category, page = 1, limit = 20, search } = req.query;
  const query = { society: req.user.society };
  if (status) query.status = status;
  if (priority) query.priority = priority;
  if (category) query.category = category;
  if (search) query.$text = { $search: search };

  const complaints = await Complaint.find(query)
    .populate('user', 'name email flatNumber wing')
    .populate('assignedTo', 'name')
    .sort({ priority: 1, createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const count = await Complaint.countDocuments(query);
  res.status(200).json({ success: true, count, pages: Math.ceil(count / limit), data: complaints });
};

// @desc    Get single complaint
// @route   GET /api/complaints/:id
const getComplaint = async (req, res) => {
  const complaint = await Complaint.findById(req.params.id)
    .populate('user', 'name email flatNumber wing phone')
    .populate('assignedTo', 'name email');

  if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });

  // Residents can only view their own
  if (req.user.role === 'resident' && complaint.user._id.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  res.status(200).json({ success: true, data: complaint });
};

// @desc    Update complaint status (Admin)
// @route   PUT /api/complaints/:id/status
const updateComplaintStatus = async (req, res) => {
  const { status, note, assignedTo } = req.body;

  const complaint = await Complaint.findById(req.params.id).populate('user', 'name email');
  if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });

  complaint.status = status;
  if (assignedTo) complaint.assignedTo = assignedTo;
  if (status === 'resolved') complaint.resolvedAt = new Date();

  complaint.timeline.push({
    status,
    note: note || `Status changed to ${status}`,
    updatedBy: req.user._id,
  });

  await complaint.save();

  // Notify resident
  await createNotification({
    userId: complaint.user._id,
    title: 'Complaint Update',
    message: `Your complaint "${complaint.title}" is now ${status.replace('_', ' ')}.`,
    type: 'complaint_update',
    link: '/resident/complaints',
    relatedId: complaint._id,
    relatedModel: 'Complaint',
  });

  // Send email
  await sendComplaintUpdate(complaint.user.email, complaint.user.name, complaint);

  res.status(200).json({ success: true, data: complaint });
};

// @desc    Submit rating/feedback after resolution
// @route   PUT /api/complaints/:id/rate
const rateComplaint = async (req, res) => {
  const { rating, feedback } = req.body;
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });
  if (complaint.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }
  complaint.rating = rating;
  complaint.feedback = feedback;
  await complaint.save();
  res.status(200).json({ success: true, data: complaint });
};

// @desc    Get complaint stats (Admin)
// @route   GET /api/complaints/stats
const getComplaintStats = async (req, res) => {
  const sid = req.user.society;
  const stats = await Complaint.aggregate([
    { $match: { society: sid } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  const byCategory = await Complaint.aggregate([
    { $match: { society: sid } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ]);
  const byPriority = await Complaint.aggregate([
    { $match: { society: sid } },
    { $group: { _id: '$priority', count: { $sum: 1 } } },
  ]);
  res.status(200).json({ success: true, data: { byStatus: stats, byCategory, byPriority } });
};

module.exports = { createComplaint, getMyComplaints, getAllComplaints, getComplaint, updateComplaintStatus, rateComplaint, getComplaintStats };
