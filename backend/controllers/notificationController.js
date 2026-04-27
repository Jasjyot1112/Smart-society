const Notification = require('../models/Notification');

// @desc    Get user notifications
// @route   GET /api/notifications
const getNotifications = async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const notifications = await Notification.find({ society: req.user.society, user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const unreadCount = await Notification.countDocuments({ user: req.user._id, isRead: false });
  const total = await Notification.countDocuments({ user: req.user._id });

  res.status(200).json({
    success: true,
    unreadCount,
    total,
    pages: Math.ceil(total / limit),
    data: notifications,
  });
};

// @desc    Mark all as read
// @route   PUT /api/notifications/read
const markAllRead = async (req, res) => {
  await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
  res.status(200).json({ success: true, message: 'All notifications marked as read' });
};

// @desc    Mark single as read
// @route   PUT /api/notifications/:id/read
const markOneRead = async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { isRead: true },
    { new: true }
  );
  if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
  res.status(200).json({ success: true, data: notification });
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
const deleteNotification = async (req, res) => {
  await Notification.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  res.status(200).json({ success: true, message: 'Notification deleted' });
};

module.exports = { getNotifications, markAllRead, markOneRead, deleteNotification };
