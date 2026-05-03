const Staff = require('../models/Staff');
const QRCode = require('qrcode');
const { logAction } = require('../services/auditService');

// Helper: generate next staffId e.g. SS-2026-001
const generateStaffId = async () => {
  const year = new Date().getFullYear();
  const count = await Staff.countDocuments();
  const num = String(count + 1).padStart(3, '0');
  return `SS-${year}-${num}`;
};

// Helper: generate QR as base64 data URL
const generateQR = async (text) => {
  return await QRCode.toDataURL(text, { width: 256, margin: 2 });
};

// @desc    Get all staff (Admin / Security)
// @route   GET /api/staff
const getStaffList = async (req, res) => {
  const staff = await Staff.find({ society: req.user.society, isActive: true }).sort({ name: 1 });
  res.status(200).json({ success: true, count: staff.length, data: staff });
};

// @desc    Get single staff member with full attendance history
// @route   GET /api/staff/:id
const getStaffById = async (req, res) => {
  const staff = await Staff.findOne({ _id: req.params.id, society: req.user.society });
  if (!staff) return res.status(404).json({ success: false, message: 'Staff not found' });
  res.status(200).json({ success: true, data: staff });
};

// @desc    Get staff by staffId (for QR scan) — Security accessible
// @route   GET /api/staff/qr/:staffId
const getStaffByStaffId = async (req, res) => {
  const staff = await Staff.findOne({ staffId: req.params.staffId, society: req.user.society, isActive: true });
  if (!staff) return res.status(404).json({ success: false, message: 'Staff ID not found' });
  res.status(200).json({ success: true, data: staff });
};

// @desc    Add new society staff member (Admin)
// @route   POST /api/staff
const addStaff = async (req, res) => {
  const { name, role, phone, workArea, dailySalary, joiningDate } = req.body;

  const staffId = await generateStaffId();
  const qrCode = await generateQR(staffId);

  const staff = await Staff.create({
    society: req.user.society,
    staffId,
    qrCode,
    name,
    role,
    phone,
    workArea: workArea || 'General',
    dailySalary: dailySalary || 0,
    joiningDate: joiningDate || new Date(),
  });

  await logAction(req.user._id, 'staff.created', 'Staff', staff._id, { name, role, staffId }, req);

  res.status(201).json({ success: true, data: staff });
};

// @desc    Update staff member (Admin)
// @route   PUT /api/staff/:id
const updateStaff = async (req, res) => {
  let staff = await Staff.findById(req.params.id);
  if (!staff) return res.status(404).json({ success: false, message: 'Staff not found' });

  // Prevent overwriting auto-generated fields
  delete req.body.staffId;
  delete req.body.qrCode;

  staff = await Staff.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  res.status(200).json({ success: true, data: staff });
};

// @desc    Deactivate staff member (Admin)
// @route   DELETE /api/staff/:id
const deactivateStaff = async (req, res) => {
  const staff = await Staff.findById(req.params.id);
  if (!staff) return res.status(404).json({ success: false, message: 'Staff not found' });

  staff.isActive = false;
  await staff.save();

  await logAction(req.user._id, 'staff.deactivated', 'Staff', staff._id, { name: staff.name }, req);
  res.status(200).json({ success: true, message: 'Staff deactivated' });
};

// @desc    Mark staff attendance - Check In/Out (Security)
// @route   POST /api/staff/:id/attendance
const markAttendance = async (req, res) => {
  const staff = await Staff.findById(req.params.id);
  if (!staff) return res.status(404).json({ success: false, message: 'Staff not found' });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const attendanceIndex = staff.attendance.findIndex(a => {
    const d = new Date(a.date);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  });

  if (staff.status === 'outside') {
    // Checking IN
    if (attendanceIndex > -1) {
      staff.attendance[attendanceIndex].checkIn = new Date();
      staff.attendance[attendanceIndex].checkedInBy = req.user._id;
    } else {
      staff.attendance.push({
        date: today,
        checkIn: new Date(),
        checkedInBy: req.user._id,
      });
    }
    staff.status = 'inside';
    await staff.save();
    await logAction(req.user._id, 'staff.check_in', 'Staff', staff._id, { name: staff.name }, req);
    return res.status(200).json({ success: true, action: 'check_in', data: staff });
  } else {
    // Checking OUT
    if (attendanceIndex > -1) {
      staff.attendance[attendanceIndex].checkOut = new Date();
      staff.attendance[attendanceIndex].checkedOutBy = req.user._id;
    }
    staff.status = 'outside';
    await staff.save();
    await logAction(req.user._id, 'staff.check_out', 'Staff', staff._id, { name: staff.name }, req);
    return res.status(200).json({ success: true, action: 'check_out', data: staff });
  }
};

// @desc    Get staff salary summary for a given month (Admin)
// @route   GET /api/staff/:id/salary?month=5&year=2026
const getStaffSalary = async (req, res) => {
  const { month, year } = req.query;
  const m = parseInt(month) || new Date().getMonth() + 1;
  const y = parseInt(year) || new Date().getFullYear();

  const staff = await Staff.findOne({ _id: req.params.id, society: req.user.society });
  if (!staff) return res.status(404).json({ success: false, message: 'Staff not found' });

  // Filter attendance for this month/year
  const monthAttendance = staff.attendance.filter(a => {
    const d = new Date(a.date);
    return d.getMonth() + 1 === m && d.getFullYear() === y;
  });

  // Working days = days where checkIn is recorded
  const workingDays = monthAttendance.filter(a => a.checkIn).length;

  // Calculate hours per day
  const attendanceSummary = monthAttendance.map(a => {
    const hoursWorked = a.checkIn && a.checkOut
      ? ((new Date(a.checkOut) - new Date(a.checkIn)) / (1000 * 60 * 60)).toFixed(2)
      : a.checkIn ? 'Still inside / Not checked out' : 0;
    return {
      date: a.date,
      checkIn: a.checkIn,
      checkOut: a.checkOut,
      hoursWorked,
    };
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  const totalSalary = workingDays * staff.dailySalary;

  res.status(200).json({
    success: true,
    data: {
      staffId: staff.staffId,
      name: staff.name,
      role: staff.role,
      workArea: staff.workArea,
      dailySalary: staff.dailySalary,
      month: m,
      year: y,
      workingDays,
      totalSalary,
      attendance: attendanceSummary,
    },
  });
};

module.exports = {
  getStaffList,
  getStaffById,
  getStaffByStaffId,
  addStaff,
  updateStaff,
  deactivateStaff,
  markAttendance,
  getStaffSalary,
};
