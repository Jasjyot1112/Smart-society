const SOSAlert = require('../models/SOSAlert');
const { broadcast } = require('../config/socket');
const { logAction } = require('../services/auditService');

// @desc    Create an SOS Alert (Resident)
// @route   POST /api/sos
const createAlert = async (req, res) => {
  const { type, message } = req.body;

  const alert = await SOSAlert.create({
    society: req.user.society,
    resident: req.user._id,
    flatNumber: req.user.flatNumber,
    wing: req.user.wing,
    type,
    message,
  });

  // Emit Socket.io event to everyone (only security/admin overlay processes it)
  broadcast('sos_alert', {
    alertId: alert._id,
    type: alert.type,
    message: alert.message,
    residentName: req.user.name,
    flatNumber: req.user.flatNumber,
    wing: req.user.wing,
    createdAt: alert.createdAt
  });

  await logAction(req.user._id, 'sos.created', 'SOSAlert', alert._id, { type }, req);

  res.status(201).json({ success: true, data: alert });
};

// @desc    Acknowledge SOS Alert (Security/Admin)
// @route   PUT /api/sos/:id/acknowledge
const acknowledgeAlert = async (req, res) => {
  const alert = await SOSAlert.findById(req.params.id);
  if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });
  if (alert.status !== 'active') return res.status(400).json({ success: false, message: 'Alert is no longer active' });

  alert.status = 'acknowledged';
  alert.acknowledgedBy = req.user._id;
  alert.acknowledgedAt = new Date();
  await alert.save();

  broadcast('sos_acknowledged', {
    alertId: alert._id,
    acknowledgedBy: req.user.name
  });

  res.status(200).json({ success: true, data: alert });
};

// @desc    Resolve SOS Alert (Security/Admin)
// @route   PUT /api/sos/:id/resolve
const resolveAlert = async (req, res) => {
  const { resolutionNotes } = req.body;
  const alert = await SOSAlert.findById(req.params.id);
  if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });

  alert.status = 'resolved';
  alert.resolvedAt = new Date();
  alert.resolutionNotes = resolutionNotes;
  await alert.save();

  broadcast('sos_resolved', {
    alertId: alert._id
  });

  res.status(200).json({ success: true, data: alert });
};

// @desc    Get active alerts
// @route   GET /api/sos/active
const getActiveAlerts = async (req, res) => {
  const alerts = await SOSAlert.find({ 
    society: req.user.society, 
    status: { $in: ['active', 'acknowledged'] } 
  }).populate('resident', 'name phone').sort({ createdAt: -1 });

  res.status(200).json({ success: true, count: alerts.length, data: alerts });
};

// @desc    Get SOS history
// @route   GET /api/sos/history
const getHistory = async (req, res) => {
  const alerts = await SOSAlert.find({ 
    society: req.user.society, 
    status: 'resolved' 
  })
    .populate('resident', 'name phone')
    .populate('acknowledgedBy', 'name role')
    .sort({ createdAt: -1 })
    .limit(50);

  res.status(200).json({ success: true, data: alerts });
};

module.exports = { createAlert, acknowledgeAlert, resolveAlert, getActiveAlerts, getHistory };
