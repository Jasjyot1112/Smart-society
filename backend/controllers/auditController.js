const AuditLog = require('../models/AuditLog');

// @desc    Get audit logs (admin only)
// @route   GET /api/audit
const getAuditLogs = async (req, res) => {
  const { userId, entity, action, startDate, endDate, page = 1, limit = 30 } = req.query;

  const query = { society: req.user.society };
  if (userId) query.user = userId;
  if (entity) query.entity = entity;
  if (action) query.action = { $regex: action, $options: 'i' };
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const [logs, count] = await Promise.all([
    AuditLog.find(query)
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit)),
    AuditLog.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    count,
    pages: Math.ceil(count / Number(limit)),
    data: logs,
  });
};

module.exports = { getAuditLogs };
