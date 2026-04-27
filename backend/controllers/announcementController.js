const Announcement = require('../models/Announcement');
const { broadcast } = require('../config/socket');

// @desc    Create a new announcement
// @route   POST /api/announcements
const createAnnouncement = async (req, res) => {
  const { title, description, type } = req.body;

  let image = {};
  if (req.file) {
    image = {
      url: `http://localhost:${process.env.PORT || 5000}/uploads/${req.file.filename}`,
      publicId: req.file.filename,
    };
  }

  const announcement = await Announcement.create({
    society: req.user.society,
    title,
    description,
    type,
    image: image.url ? image : undefined,
    createdBy: req.user._id,
  });

  await announcement.populate('createdBy', 'name role');

  // Trigger real-time alert via socket
  broadcast('notification', {
    title: `📢 ${type.toUpperCase()}: ${title}`,
    message: description.substring(0, 50) + '...',
    type: 'general',
    link: '/resident/announcements'
  });

  res.status(201).json({ success: true, data: announcement });
};

// @desc    Get all announcements
// @route   GET /api/announcements
const getAnnouncements = async (req, res) => {
  const { type, page = 1, limit = 20 } = req.query;
  const query = { society: req.user.society };

  if (type) query.type = type;

  const announcements = await Announcement.find(query)
    .populate('createdBy', 'name role')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const count = await Announcement.countDocuments(query);

  res.status(200).json({
    success: true,
    count,
    pages: Math.ceil(count / limit),
    data: announcements,
  });
};

// @desc    Delete announcement
// @route   DELETE /api/announcements/:id
const deleteAnnouncement = async (req, res) => {
  const announcement = await Announcement.findOne({ _id: req.params.id, society: req.user.society });
  
  if (!announcement) return res.status(404).json({ success: false, message: 'Announcement not found' });
  
  await announcement.deleteOne();
  res.status(200).json({ success: true, message: 'Announcement deleted successfully' });
};

module.exports = { createAnnouncement, getAnnouncements, deleteAnnouncement };
