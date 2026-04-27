const Notification = require('../models/Notification');
const { emitToUser } = require('../config/socket');

/**
 * Create a notification and emit via Socket.io
 */
const createNotification = async ({ userId, title, message, type, link, relatedId, relatedModel, societyId }) => {
  try {
    const notifData = {
      user: userId,
      title,
      message,
      type: type || 'general',
      link,
      relatedId,
      relatedModel,
    };
    // Attach society if provided
    if (societyId) notifData.society = societyId;

    const notification = await Notification.create(notifData);

    // Real-time push via socket
    emitToUser(userId.toString(), 'notification', {
      _id: notification._id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      link: notification.link,
      isRead: false,
      createdAt: notification.createdAt,
    });

    return notification;
  } catch (err) {
    console.error('Notification creation error:', err.message);
  }
};

/**
 * Create notifications for all admins in the same society
 */
const notifyAdmins = async (User, { title, message, type, link, relatedId, relatedModel, societyId }) => {
  const query = { role: 'admin', isActive: true };
  if (societyId) query.society = societyId;

  const admins = await User.find(query).select('_id');
  const promises = admins.map((admin) =>
    createNotification({ userId: admin._id, title, message, type, link, relatedId, relatedModel, societyId })
  );
  await Promise.allSettled(promises);
};

module.exports = { createNotification, notifyAdmins };
