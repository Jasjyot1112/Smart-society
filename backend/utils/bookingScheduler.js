const cron = require('node-cron');
const Booking = require('../models/Booking');
const { createNotification } = require('../services/notificationService');
const { logAction } = require('../services/auditService');

/**
 * Auto-cancel pending bookings older than 30 minutes
 * and promote the first person on the waitlist
 */
const autoCancelExpiredBookings = async () => {
  try {
    const cutoff = new Date(Date.now() - 30 * 60 * 1000); // 30 min ago

    const expired = await Booking.find({
      status: 'pending',
      createdAt: { $lt: cutoff },
    }).populate('facility', 'name');

    for (const booking of expired) {
      booking.status = 'cancelled';
      booking.cancelledAt = new Date();
      booking.cancelReason = 'Auto-cancelled: payment not completed within 30 minutes';
      await booking.save();

      // Notify the user their pending booking was cancelled
      await createNotification({
        userId: booking.user,
        title: 'Booking Auto-Cancelled',
        message: `Your pending booking for ${booking.facility?.name} was cancelled because payment was not completed in time.`,
        type: 'booking_cancelled',
        link: '/resident/bookings',
        relatedId: booking._id,
        relatedModel: 'Booking',
      });

      // Log to audit
      await logAction(
        booking.user,
        'booking.auto_cancelled',
        'Booking',
        booking._id,
        { reason: 'Payment timeout' },
        null,
        'Auto-cancelled expired pending booking'
      );

      // Promote first waitlisted user if any waitlist booking shares same slot
      await promoteWaitlist(booking);
    }

    if (expired.length > 0) {
      console.log(`⏰ Auto-cancelled ${expired.length} expired pending booking(s)`);
    }
  } catch (err) {
    console.error('Booking scheduler error:', err.message);
  }
};

/**
 * When a booking is cancelled/expired, promote waitlisted user
 */
const promoteWaitlist = async (cancelledBooking) => {
  try {
    // Find any active booking for same slot with a waitlist
    const sameSlotBooking = await Booking.findOne({
      facility: cancelledBooking.facility,
      'slot.startTime': cancelledBooking.slot.startTime,
      date: cancelledBooking.date,
      status: 'confirmed',
      'waitlist.0': { $exists: true },
    });

    if (!sameSlotBooking || sameSlotBooking.waitlist.length === 0) return;

    const first = sameSlotBooking.waitlist[0];
    sameSlotBooking.waitlist.shift();
    await sameSlotBooking.save();

    await createNotification({
      userId: first.user,
      title: '🎉 Slot Available!',
      message: `A slot opened up for ${sameSlotBooking.facility?.name}. Book now before it's gone!`,
      type: 'booking_confirmed',
      link: '/resident/book',
    });

    console.log(`✅ Waitlist user ${first.user} notified of available slot`);
  } catch (err) {
    console.error('Waitlist promotion error:', err.message);
  }
};

/**
 * Start the scheduler — runs every 5 minutes
 */
const startBookingScheduler = () => {
  cron.schedule('*/5 * * * *', autoCancelExpiredBookings);
  console.log('⏰ Booking scheduler started (auto-cancel every 5 min)');
};

module.exports = { startBookingScheduler, promoteWaitlist };
