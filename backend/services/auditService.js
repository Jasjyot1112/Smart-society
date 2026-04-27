const AuditLog = require('../models/AuditLog');

/**
 * Log an action to the audit trail
 * @param {string} userId - Who performed the action
 * @param {string} action - Dot-notation action e.g. 'booking.created'
 * @param {string} entity - Model name e.g. 'Booking'
 * @param {string} entityId - Document _id
 * @param {object} changes - { field: { from, to } } or any metadata
 * @param {object} req - Express request (optional, for IP/UA)
 * @param {string} description - Human-readable description
 */
const logAction = async (userId, action, entity, entityId, changes = {}, req = null, description = '') => {
  try {
    await AuditLog.create({
      user: userId,
      action,
      entity,
      entityId,
      changes,
      description,
      society: req?.user?.society || null,
      ip: req?.ip || req?.connection?.remoteAddress || null,
      userAgent: req?.headers?.['user-agent']?.substring(0, 200) || null,
    });
  } catch (err) {
    // Never let audit logging crash the main flow
    console.error('Audit log error:', err.message);
  }
};

module.exports = { logAction };
