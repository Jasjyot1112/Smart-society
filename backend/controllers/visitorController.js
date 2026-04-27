const Visitor = require('../models/Visitor');
const User = require('../models/User');
const { createOTPObject, verifyOTP } = require('../services/otpService');
const { generateVisitorQR } = require('../services/qrService');
const { createNotification } = require('../services/notificationService');
const { sendVisitorOTP } = require('../services/emailService');
const { emitToUser } = require('../config/socket');
const { logAction } = require('../services/auditService');

// @desc    Pre-Approve a visitor (Resident creates request)
// @route   POST /api/visitors/pre-approve
const preApproveVisitor = async (req, res) => {
  const { name, phone, purpose, vehicleNumber, activeUntil } = req.body;

  const visitor = await Visitor.create({ society: req.user.society,
    name,
    phone,
    purpose: purpose || 'pre_approved',
    flatNumber: req.user.flatNumber,
    wing: req.user.wing,
    resident: req.user._id,
    guard: null, // No guard involved yet
    status: 'approved',
    preApproved: true,
    preApprovedUntil: activeUntil || new Date(Date.now() + 24 * 60 * 60 * 1000), // default 24h
    vehicleNumber,
    approvedAt: new Date(),
    auditLog: [{ action: 'Pre-Approved created', performedBy: req.user._id, notes: `Valid until ${activeUntil}` }],
  });

  // Generate QR code for instant entry
  const { qrToken, qrCode } = await generateVisitorQR(visitor._id.toString());
  visitor.qrToken = qrToken;
  visitor.qrCode = qrCode;
  await visitor.save();

  await logAction(req.user._id, 'visitor.pre_approved', 'Visitor', visitor._id, { visitorName: name }, req);

  res.status(201).json({ success: true, message: 'Visitor pre-approved successfully', data: visitor });
};

// @desc    Create visitor entry request (Security Guard)
// @route   POST /api/visitors
const createVisitorRequest = async (req, res) => {
  const { name, phone, flatNumber, wing, purpose, vehicleNumber, notes } = req.body;

  const residentQuery = { role: 'resident', flatNumber, isActive: true };
  if (wing) residentQuery.wing = wing;
  const resident = await User.findOne(residentQuery);

  if (!resident) {
    return res.status(404).json({ success: false, message: `No resident found at flat ${wing ? wing + '-' : ''}${flatNumber}` });
  }

  // ── Auto Pre-Approve Check ──────────────────────────────────────────────────
  // If there's an active pre-approved visitor matching name or phone for this flat
  const exactPreApproved = await Visitor.findOne({
    resident: resident._id,
    status: 'approved',
    preApproved: true,
    preApprovedUntil: { $gt: new Date() },
    $or: [{ phone }, { name: { $regex: new RegExp(`^${name}$`, 'i') } }],
  });

  if (exactPreApproved) {
    // Instant entry allowed
    exactPreApproved.status = 'entered';
    exactPreApproved.entryTime = new Date();
    exactPreApproved.guard = req.user._id;
    exactPreApproved.auditLog.push({ action: 'Entered via Pre-Approval', performedBy: req.user._id });
    await exactPreApproved.save();

    await createNotification({
      userId: resident._id,
      title: 'Pre-Approved Entry Executed',
      message: `${name} has entered the gate.`,
      type: 'visitor_entered',
    });

    await logAction(req.user._id, 'visitor.entered', 'Visitor', exactPreApproved._id, { type: 'pre_approved' }, req);

    return res.status(200).json({
      success: true,
      message: 'Visitor pre-approved. Instant entry granted.',
      data: exactPreApproved,
    });
  }

  const visitor = await Visitor.create({ society: req.user.society,
    name, phone, purpose: purpose || 'guest', flatNumber, wing,
    resident: resident._id,
    guard: req.user._id,
    status: 'pending',
    vehicleNumber, notes,
    auditLog: [{ action: 'Request created', performedBy: req.user._id }],
  });

  await createNotification({
    userId: resident._id,
    title: '🚪 Visitor at Gate',
    message: `${name} is at the gate waiting for approval.`,
    type: 'visitor_request',
    link: '/resident/visitors',
    relatedId: visitor._id,
    relatedModel: 'Visitor',
  });

  emitToUser(resident._id.toString(), 'visitorRequest', {
    visitorId: visitor._id, visitorName: name, phone, purpose, guardName: req.user.name
  });

  res.status(201).json({
    success: true,
    message: 'Visitor request sent to resident',
    data: { visitorId: visitor._id, residentName: resident.name },
  });
};

// @desc    Resident approves/denies visitor
// @route   PUT /api/visitors/:id/respond
const respondToVisitor = async (req, res) => {
  const { action, denialReason } = req.body;
  const visitor = await Visitor.findById(req.params.id).populate('guard', 'name');

  if (!visitor) return res.status(404).json({ success: false, message: 'Visitor request not found' });
  if (visitor.resident.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Not authorized' });
  if (visitor.status !== 'pending') return res.status(400).json({ success: false, message: 'This visitor request is no longer pending.' });

  if (action === 'approve') {
    visitor.status = 'entered';
    visitor.entryTime = new Date();
    visitor.auditLog.push({ action: 'Approved and Entered', performedBy: req.user._id });

    const { qrToken, qrCode } = await generateVisitorQR(visitor._id.toString());
    visitor.qrToken = qrToken; visitor.qrCode = qrCode;
    await visitor.save();

    if (visitor.guard) {
      await createNotification({
        userId: visitor.guard._id,
        title: 'Visitor Approved ✅',
        message: `${req.user.name} approved entry for ${visitor.name}`,
        type: 'visitor_approved',
      });
      emitToUser(visitor.guard._id.toString(), 'visitorApproved', { visitorId: visitor._id, visitorName: visitor.name, approvedBy: req.user.name, qrCode: visitor.qrCode });
    }

    await logAction(req.user._id, 'visitor.approved', 'Visitor', visitor._id, {}, req);

  } else if (action === 'deny') {
    visitor.status = 'denied';
    visitor.deniedAt = new Date();
    visitor.denialReason = denialReason || '';
    visitor.auditLog.push({ action: 'Denied', performedBy: req.user._id, notes: denialReason });
    await visitor.save();

    if (visitor.guard) {
      emitToUser(visitor.guard._id.toString(), 'visitorDenied', { visitorId: visitor._id, visitorName: visitor.name, deniedBy: req.user.name, reason: denialReason });
    }
    await logAction(req.user._id, 'visitor.denied', 'Visitor', visitor._id, { reason: denialReason }, req);
  }

  res.status(200).json({ success: true, data: visitor });
};



// @desc    Verify by QR token (Guard scans QR)
// @route   POST /api/visitors/verify-qr
const verifyQRCode = async (req, res) => {
  const { visitorId, token } = req.body;
  const visitor = await Visitor.findById(visitorId);
  if (!visitor) return res.status(404).json({ success: false, message: 'Visitor not found' });
  if (visitor.status !== 'approved') return res.status(400).json({ success: false, message: 'Visitor has not been approved' });
  if (visitor.qrToken !== token) return res.status(400).json({ success: false, message: 'Invalid QR code' });

  visitor.status = 'entered';
  visitor.entryTime = new Date();
  visitor.auditLog.push({ action: 'Entered via QR', performedBy: req.user._id });
  await visitor.save();

  await logAction(req.user._id, 'visitor.entered', 'Visitor', visitor._id, { method: 'QR' }, req);

  res.status(200).json({ success: true, message: 'QR verified. Visitor may enter.', data: visitor });
};

// @desc    Mark exit time (Guard)
// @route   PUT /api/visitors/:id/exit
const markExit = async (req, res) => {
  const visitor = await Visitor.findById(req.params.id);
  if (!visitor) return res.status(404).json({ success: false, message: 'Visitor not found' });
  if (visitor.status !== 'entered') return res.status(400).json({ success: false, message: 'Visitor has not entered yet' });

  visitor.status = 'exited';
  visitor.exitTime = new Date();
  visitor.auditLog.push({ action: 'Exited', performedBy: req.user._id });
  await visitor.save();

  await logAction(req.user._id, 'visitor.exited', 'Visitor', visitor._id, { durationMinutes: visitor.duration }, req);

  res.status(200).json({ success: true, data: visitor });
};

// @desc    Get visitor history
// @route   GET /api/visitors
const getVisitors = async (req, res) => {
  const { status, flatNumber, page = 1, limit = 20, date, preApproved } = req.query;
  const query = { society: req.user.society };

  if (req.user.role === 'resident') query.resident = req.user._id;
  if (req.user.role === 'security') query.guard = req.user._id;
  if (status) query.status = status;
  if (flatNumber) query.flatNumber = flatNumber;
  if (preApproved === 'true') query.preApproved = true;
  if (date) {
    const d = new Date(date);
    query.createdAt = {
      $gte: new Date(d.setHours(0, 0, 0, 0)),
      $lte: new Date(d.setHours(23, 59, 59, 999)),
    };
  }

  const visitors = await Visitor.find(query)
    .populate('resident', 'name flatNumber wing')
    .populate('guard', 'name')
    .populate('auditLog.performedBy', 'name role')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const count = await Visitor.countDocuments(query);
  res.status(200).json({ success: true, count, pages: Math.ceil(count / limit), data: visitors });
};

// @desc    Get single visitor
// @route   GET /api/visitors/:id
const getVisitor = async (req, res) => {
  const visitor = await Visitor.findById(req.params.id)
    .populate('resident', 'name flatNumber wing phone')
    .populate('guard', 'name')
    .populate('auditLog.performedBy', 'name role');
  if (!visitor) return res.status(404).json({ success: false, message: 'Visitor not found' });
  res.status(200).json({ success: true, data: visitor });
};

module.exports = { preApproveVisitor, createVisitorRequest, respondToVisitor, verifyQRCode, markExit, getVisitors, getVisitor };
