const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Facility = require('../models/Facility');
const { createNotification } = require('../services/notificationService');
const { emitToRoom } = require('../config/socket');
const { logAction } = require('../services/auditService');
const { promoteWaitlist } = require('../utils/bookingScheduler');

// ─── Facility CRUD ────────────────────────────────────────────────────────────

const getFacilities = async (req, res) => {
  const facilities = await Facility.find({ society: req.user.society, isAvailable: true }).sort('name');
  
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
  
  const bookingsToday = await Booking.aggregate([
    { $match: { society: req.user.society, date: { $gte: todayStart, $lte: todayEnd }, status: { $in: ['confirmed', 'pending'] } } },
    { $group: { _id: '$facility', count: { $sum: 1 } } }
  ]);
  
  const bookingCountMap = bookingsToday.reduce((acc, curr) => {
    acc[curr._id.toString()] = curr.count;
    return acc;
  }, {});

  const data = facilities.map(f => {
    const obj = f.toObject();
    obj.availableToday = Math.max(0, (obj.slots?.length || 0) - (bookingCountMap[f._id.toString()] || 0));
    return obj;
  });

  res.status(200).json({ success: true, count: facilities.length, data });
};

const getFacility = async (req, res) => {
  const facility = await Facility.findById(req.params.id);
  if (!facility) return res.status(404).json({ success: false, message: 'Facility not found' });
  res.status(200).json({ success: true, data: facility });
};

const createFacility = async (req, res) => {
  const facility = await Facility.create({ society: req.user.society, ...req.body, addedBy: req.user._id });
  res.status(201).json({ success: true, data: facility });
};

const updateFacility = async (req, res) => {
  const facility = await Facility.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!facility) return res.status(404).json({ success: false, message: 'Facility not found' });
  res.status(200).json({ success: true, data: facility });
};

const deleteFacility = async (req, res) => {
  const facility = await Facility.findByIdAndDelete(req.params.id);
  if (!facility) return res.status(404).json({ success: false, message: 'Facility not found' });
  res.status(200).json({ success: true, message: 'Facility deleted' });
};

// ─── Calendar Data ────────────────────────────────────────────────────────────

const getCalendarData = async (req, res) => {
  const { facilityId } = req.params;
  const { date } = req.query;

  const queryDate = date ? new Date(date) : new Date();
  const startOfDay = new Date(queryDate); startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(queryDate); endOfDay.setHours(23, 59, 59, 999);

  const bookings = await Booking.find({
    society: req.user.society, facility: facilityId,
    date: { $gte: startOfDay, $lte: endOfDay },
    status: { $in: ['confirmed', 'pending'] },
  }).select('slot user status');

  res.status(200).json({ success: true, data: bookings });
};

// ─── Create Booking (Atomic) ──────────────────────────────────────────────────

const createBooking = async (req, res) => {
  const { facilityId, date, slot, joinWaitlist = false } = req.body;
  const userId = req.user._id;

  const facility = await Facility.findById(facilityId);
  if (!facility) return res.status(404).json({ success: false, message: 'Facility not found' });
  if (!facility.isAvailable) return res.status(400).json({ success: false, message: 'Facility is not available' });

  const bookingDate = new Date(date);
  bookingDate.setHours(12, 0, 0, 0); // Normalize to noon to avoid timezone issues

  // Check unavailable dates
  const isUnavailable = facility.unavailableDates?.some(
    (d) => new Date(d).toDateString() === bookingDate.toDateString()
  );
  if (isUnavailable) {
    return res.status(400).json({ success: false, message: 'Facility is not available on this date' });
  }

  const startOfDay = new Date(bookingDate); startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(bookingDate); endOfDay.setHours(23, 59, 59, 999);

  // ── ATOMIC conflict check using findOneAndUpdate ──────────────────────────
  // This prevents race conditions by using a single atomic DB operation
  const conflictingBooking = await Booking.findOne({
    society: req.user.society, facility: facilityId,
    date: { $gte: startOfDay, $lte: endOfDay },
    'slot.startTime': slot.startTime,
    status: { $in: ['confirmed', 'pending'] },
  });

  if (conflictingBooking) {
    // ── Waitlist logic ──────────────────────────────────────────────────────
    if (joinWaitlist) {
      // Check if user is already on the waitlist
      const alreadyWaiting = conflictingBooking.waitlist.some(
        (w) => w.user.toString() === userId.toString()
      );
      if (alreadyWaiting) {
        const position = conflictingBooking.waitlist.findIndex(
          (w) => w.user.toString() === userId.toString()
        ) + 1;
        return res.status(200).json({
          success: true,
          waitlisted: true,
          message: `You are already on the waitlist at position ${position}.`,
          waitlistPosition: position,
        });
      }

      // Add to waitlist atomically
      await Booking.findByIdAndUpdate(
        conflictingBooking._id,
        { $push: { waitlist: { user: userId, requestedAt: new Date() } } }
      );

      const position = conflictingBooking.waitlist.length + 1;

      await createNotification({
        userId,
        title: 'Added to Waitlist',
        message: `You are #${position} on the waitlist for ${facility.name} on ${bookingDate.toDateString()} at ${slot.label || slot.startTime}. We'll notify you if a slot opens.`,
        type: 'booking_waitlisted',
        link: '/resident/bookings',
      });

      return res.status(200).json({
        success: true,
        waitlisted: true,
        message: `Added to waitlist at position #${position}. You'll be notified when slot opens.`,
        waitlistPosition: position,
      });
    }

    return res.status(409).json({
      success: false,
      message: 'This slot is already booked.',
      slotTaken: true,
      waitlistAvailable: true,
      currentWaitlistLength: conflictingBooking.waitlist.length,
    });
  }

  // ── Weekly limit check ─────────────────────────────────────────────────────
  const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - weekStart.getDay()); weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6); weekEnd.setHours(23, 59, 59, 999);

  const weeklyCount = await Booking.countDocuments({
    user: userId,
    society: req.user.society, facility: facilityId,
    date: { $gte: weekStart, $lte: weekEnd },
    status: { $in: ['confirmed', 'pending'] },
  });

  if (weeklyCount >= (facility.maxBookingsPerWeek || 3)) {
    return res.status(400).json({
      success: false,
      message: `You can only book ${facility.maxBookingsPerWeek || 3} times per week for this facility.`,
    });
  }

  // ── Create booking ─────────────────────────────────────────────────────────
  const booking = await Booking.create({ society: req.user.society,
    society: req.user.society, facility: facilityId,
    user: userId,
    date: bookingDate,
    slot,
    status: 'confirmed',
  });

  await booking.populate('facility', 'name type');

  // Notifications + socket
  await createNotification({
    userId,
    title: 'Booking Confirmed ✅',
    message: `Your booking for ${facility.name} on ${bookingDate.toDateString()} at ${slot.label || slot.startTime} is confirmed.`,
    type: 'booking_confirmed',
    link: '/resident/bookings',
    relatedId: booking._id,
    relatedModel: 'Booking',
  });

  emitToRoom(`facility:${facilityId}`, 'bookingCreated', { date, slot, bookingId: booking._id });

  // Audit log
  await logAction(userId, 'booking.created', 'Booking', booking._id, { facility: facility.name, date, slot }, req);

  res.status(201).json({ success: true, data: booking });
};

// ─── Get My Bookings ──────────────────────────────────────────────────────────

const getMyBookings = async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;
  const query = { user: req.user._id };
  if (status) query.status = status;

  const bookings = await Booking.find(query)
    .populate('facility', 'name type image')
    .sort({ date: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const count = await Booking.countDocuments(query);
  res.status(200).json({ success: true, count, pages: Math.ceil(count / limit), data: bookings });
};

// ─── Get All Bookings (Admin) ─────────────────────────────────────────────────

const getAllBookings = async (req, res) => {
  const { facilityId, status, date, page = 1, limit = 20 } = req.query;
  const query = { society: req.user.society };
  if (facilityId) query.facility = facilityId;
  if (status) query.status = status;
  if (date) {
    const d = new Date(date);
    query.date = { $gte: new Date(d.setHours(0, 0, 0, 0)), $lte: new Date(d.setHours(23, 59, 59, 999)) };
  }

  const bookings = await Booking.find(query)
    .populate('facility', 'name type')
    .populate('user', 'name email flatNumber wing')
    .sort({ date: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const count = await Booking.countDocuments(query);
  res.status(200).json({ success: true, count, pages: Math.ceil(count / limit), data: bookings });
};

// ─── Cancel Booking ───────────────────────────────────────────────────────────

const cancelBooking = async (req, res) => {
  const booking = await Booking.findById(req.params.id).populate('facility', 'name');
  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

  if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized to cancel this booking' });
  }
  if (!['confirmed', 'pending'].includes(booking.status)) {
    return res.status(400).json({ success: false, message: 'Only confirmed or pending bookings can be cancelled' });
  }

  booking.status = 'cancelled';
  booking.cancelledAt = new Date();
  booking.cancelReason = req.body.reason || 'Cancelled by user';
  await booking.save();

  emitToRoom(`facility:${booking.facility._id}`, 'bookingCancelled', { date: booking.date, slot: booking.slot, bookingId: booking._id });

  // Audit log
  await logAction(req.user._id, 'booking.cancelled', 'Booking', booking._id, { reason: booking.cancelReason }, req);

  // Promote waitlist
  await promoteWaitlist(booking);

  res.status(200).json({ success: true, data: booking });
};

// ─── Smart Slot Suggestions ───────────────────────────────────────────────────

const getSlotSuggestions = async (req, res) => {
  const { facilityId } = req.params;
  const { date } = req.query;

  const facility = await Facility.findById(facilityId);
  if (!facility) return res.status(404).json({ success: false, message: 'Facility not found' });

  const queryDate = date ? new Date(date) : new Date();
  const startOfDay = new Date(queryDate); startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(queryDate); endOfDay.setHours(23, 59, 59, 999);

  const bookedSlots = await Booking.find({
    society: req.user.society, facility: facilityId,
    date: { $gte: startOfDay, $lte: endOfDay },
    status: { $in: ['confirmed', 'pending'] },
  }).select('slot waitlist');

  const bookedTimes = bookedSlots.map((b) => b.slot.startTime);
  const availableSlots = (facility.slots || []).filter((s) => !bookedTimes.includes(s.startTime));

  // Enrich with waitlist counts
  const enriched = bookedSlots.map((b) => ({
    startTime: b.slot.startTime,
    endTime: b.slot.endTime,
    label: b.slot.label,
    waitlistCount: b.waitlist?.length || 0,
    status: 'booked',
  }));

  res.status(200).json({
    success: true,
    available: availableSlots.slice(0, 3),
    booked: enriched,
    total: facility.slots?.length || 0,
    availableCount: availableSlots.length,
  });
};

// ─── Waitlist Status ──────────────────────────────────────────────────────────

const getWaitlistStatus = async (req, res) => {
  const { facilityId } = req.params;
  const { date, startTime } = req.query;
  const userId = req.user._id;

  const startOfDay = new Date(date); startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date); endOfDay.setHours(23, 59, 59, 999);

  const booking = await Booking.findOne({
    society: req.user.society, facility: facilityId,
    date: { $gte: startOfDay, $lte: endOfDay },
    'slot.startTime': startTime,
    status: { $in: ['confirmed', 'pending'] },
  });

  if (!booking) return res.status(200).json({ success: true, data: { waitlistPosition: null, inWaitlist: false } });

  const position = booking.waitlist.findIndex((w) => w.user.toString() === userId.toString());
  res.status(200).json({
    success: true,
    data: {
      inWaitlist: position !== -1,
      waitlistPosition: position !== -1 ? position + 1 : null,
      totalWaiting: booking.waitlist.length,
    },
  });
};

module.exports = {
  getFacilities, getFacility, createFacility, updateFacility, deleteFacility,
  getCalendarData, createBooking, getMyBookings, getAllBookings, cancelBooking,
  getSlotSuggestions, getWaitlistStatus,
};
