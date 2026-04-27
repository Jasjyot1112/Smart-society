const User = require('../models/User');

// @desc    Get all users (Admin)
// @route   GET /api/users
const getUsers = async (req, res) => {
  const { role, isActive, page = 1, limit = 30, search } = req.query;
  const query = { society: req.user.society };
  if (role) query.role = role;
  if (isActive !== undefined) query.isActive = isActive === 'true';
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { flatNumber: { $regex: search, $options: 'i' } },
    ];
  }

  const users = await User.find(query)
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const count = await User.countDocuments(query);
  res.status(200).json({ success: true, count, pages: Math.ceil(count / limit), data: users });
};

// @desc    Get single user (Admin)
// @route   GET /api/users/:id
const getUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.status(200).json({ success: true, data: user });
};

// @desc    Update user (Admin)
// @route   PUT /api/users/:id
const updateUser = async (req, res) => {
  const allowedUpdates = ['name', 'phone', 'flatNumber', 'wing', 'isActive', 'role'];
  const updates = {};
  allowedUpdates.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.status(200).json({ success: true, data: user });
};

// @desc    Delete user (Admin)
// @route   DELETE /api/users/:id
const deleteUser = async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.status(200).json({ success: true, message: 'User deleted' });
};

// @desc    Get dashboard stats (Admin)
// @route   GET /api/users/stats
const getDashboardStats = async (req, res) => {
  const [totalResidents, totalAdmins, totalSecurity] = await Promise.all([
    User.countDocuments({ role: 'resident', isActive: true }),
    User.countDocuments({ role: 'admin', isActive: true }),
    User.countDocuments({ role: 'security', isActive: true }),
  ]);

  const Payment = require('../models/Payment');
  const Complaint = require('../models/Complaint');
  const Booking = require('../models/Booking');
  const Visitor = require('../models/Visitor');

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const [paidCount, pendingComplaints, activeBookings, todayVisitors, monthlyRevenue] = await Promise.all([
    Payment.countDocuments({ month: currentMonth, year: currentYear, status: 'paid' }),
    Complaint.countDocuments({ status: { $in: ['pending', 'in_progress'] } }),
    Booking.countDocuments({ status: 'confirmed', date: { $gte: new Date() } }),
    Visitor.countDocuments({ createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } }),
    Payment.aggregate([
      { $match: { month: currentMonth, year: currentYear, status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
  ]);

  res.status(200).json({
    success: true,
    data: {
      users: { residents: totalResidents, admins: totalAdmins, security: totalSecurity },
      payments: { paid: paidCount, monthlyRevenue: monthlyRevenue[0]?.total || 0 },
      complaints: { pending: pendingComplaints },
      bookings: { active: activeBookings },
      visitors: { today: todayVisitors },
    },
  });
};

module.exports = { getUsers, getUser, updateUser, deleteUser, getDashboardStats };
