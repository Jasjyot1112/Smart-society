const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Complaint = require('../models/Complaint');
const Visitor = require('../models/Visitor');
const User = require('../models/User');

// @desc    Overview KPIs
// @route   GET /api/analytics/overview
const getOverview = async (req, res) => {
  const sid = req.user.society;
  const today = new Date();
  const startOfToday = new Date(today); startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(today); endOfToday.setHours(23, 59, 59, 999);
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [
    totalResidents,
    activeComplaints,
    monthRevenue,
    visitorsToday,
    totalBookings,
    pendingPayments,
  ] = await Promise.all([
    User.countDocuments({ society: sid, role: 'resident', isActive: true }),
    Complaint.countDocuments({ society: sid, status: { $in: ['open', 'in_progress'] } }),
    Payment.aggregate([
      { $match: { society: sid, status: 'paid', paidAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Visitor.countDocuments({ society: sid, createdAt: { $gte: startOfToday, $lte: endOfToday } }),
    Booking.countDocuments({ society: sid, status: 'confirmed' }),
    Payment.countDocuments({ society: sid, status: 'pending' }),
  ]);

  res.status(200).json({
    success: true,
    data: {
      totalResidents,
      activeComplaints,
      monthRevenue: monthRevenue[0]?.total || 0,
      visitorsToday,
      totalBookings,
      pendingPayments,
    },
  });
};

// @desc    Monthly revenue trend (last 6 months)
// @route   GET /api/analytics/revenue
const getRevenueTrend = async (req, res) => {
  const sid = req.user.society;
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);

  const data = await Payment.aggregate([
    { $match: { society: sid, status: 'paid', paidAt: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: { year: { $year: '$paidAt' }, month: { $month: '$paidAt' } },
        revenue: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const formatted = data.map((d) => ({
    month: `${months[d._id.month - 1]} ${d._id.year}`,
    revenue: d.revenue,
    count: d.count,
  }));

  res.status(200).json({ success: true, data: formatted });
};

// @desc    Facility usage stats (most booked)
// @route   GET /api/analytics/facilities
const getFacilityStats = async (req, res) => {
  const sid = req.user.society;
  const data = await Booking.aggregate([
    { $match: { society: sid, status: { $in: ['confirmed', 'completed'] } } },
    { $group: { _id: '$facility', bookingCount: { $sum: 1 } } },
    {
      $lookup: {
        from: 'facilities',
        localField: '_id',
        foreignField: '_id',
        as: 'facility',
      },
    },
    { $unwind: { path: '$facility', preserveNullAndEmpty: false } },
    { $project: { name: '$facility.name', type: '$facility.type', bookingCount: 1 } },
    { $sort: { bookingCount: -1 } },
  ]);

  res.status(200).json({ success: true, data });
};

// @desc    Complaint analytics (by category, resolution time)
// @route   GET /api/analytics/complaints
const getComplaintStats = async (req, res) => {
  const sid = req.user.society;
  const [byCategory, byPriority, byStatus, resolutionTime] = await Promise.all([
    Complaint.aggregate([
      { $match: { society: sid } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Complaint.aggregate([
      { $match: { society: sid } },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]),
    Complaint.aggregate([
      { $match: { society: sid } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    // Average resolution time in hours for resolved complaints
    Complaint.aggregate([
      { $match: { society: sid, status: 'resolved', resolvedAt: { $exists: true } } },
      {
        $project: {
          resolutionHours: {
            $divide: [
              { $subtract: ['$resolvedAt', '$createdAt'] },
              1000 * 60 * 60, // ms to hours
            ],
          },
          category: 1,
        },
      },
      { $group: { _id: '$category', avgHours: { $avg: '$resolutionHours' } } },
      { $sort: { avgHours: 1 } },
    ]),
  ]);

  res.status(200).json({
    success: true,
    data: { byCategory, byPriority, byStatus, resolutionTime },
  });
};

// @desc    Visitor statistics (last 30 days)
// @route   GET /api/analytics/visitors
const getVisitorStats = async (req, res) => {
  const sid = req.user.society;
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [byDay, byPurpose, byStatus] = await Promise.all([
    Visitor.aggregate([
      { $match: { society: sid, createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Visitor.aggregate([
      { $match: { society: sid, createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: '$purpose', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Visitor.aggregate([
      { $match: { society: sid, createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
  ]);

  res.status(200).json({
    success: true,
    data: { byDay, byPurpose, byStatus },
  });
};

// @desc    Defaulters list
// @route   GET /api/analytics/defaulters
const getDefaulters = async (req, res) => {
  const sid = req.user.society;
  const today = new Date();
  const month = today.getMonth() + 1;
  const year = today.getFullYear();

  const residents = await User.find({ society: sid, role: 'resident', isActive: true }).select('name email flatNumber wing phone');
  const paid = await Payment.find({ society: sid, month, year, status: 'paid' }).select('user');
  const paidIds = paid.map(p => p.user.toString());
  const defaulters = residents.filter(r => !paidIds.includes(r._id.toString()));

  res.status(200).json({ success: true, count: defaulters.length, data: defaulters, month, year });
};

module.exports = { getOverview, getRevenueTrend, getFacilityStats, getComplaintStats, getVisitorStats, getDefaulters };
