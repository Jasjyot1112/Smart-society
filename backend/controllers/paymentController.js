const crypto = require('crypto');
const Payment = require('../models/Payment');
const User = require('../models/User');
const { createNotification } = require('../services/notificationService');
const { sendMaintenanceReminder } = require('../services/emailService');
const { generateInvoicePDF } = require('../utils/invoiceGenerator');
const { logAction } = require('../services/auditService');

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || '';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';

/**
 * Razorpay is considered configured ONLY when:
 * - Both keys are present
 * - Keys don't contain placeholder patterns (xxxx, your_, xxxxxxxx)
 * - Key ID starts with the real rzp_ prefix
 */
const isRazorpayConfigured =
  RAZORPAY_KEY_ID &&
  RAZORPAY_KEY_SECRET &&
  RAZORPAY_KEY_ID.startsWith('rzp_') &&
  !RAZORPAY_KEY_ID.includes('xxxx') &&
  !RAZORPAY_KEY_ID.includes('xxxxxxxx') &&
  !RAZORPAY_KEY_SECRET.includes('xxxx') &&
  !RAZORPAY_KEY_SECRET.includes('xxxxxxxx') &&
  !RAZORPAY_KEY_SECRET.startsWith('your_') &&
  RAZORPAY_KEY_ID.length > 20 &&
  RAZORPAY_KEY_SECRET.length > 20;

let razorpay = null;
if (isRazorpayConfigured) {
  const Razorpay = require('razorpay');
  razorpay = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });
  console.log('✅ Razorpay payment gateway initialized');
} else {
  console.warn('⚠️  Razorpay not configured. Add real RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to backend/.env');
}

// @desc    Create Razorpay order with Late Fee Logic
// @route   POST /api/payments/order
const createOrder = async (req, res) => {
  const { month, year, amount } = req.body;
  const user = req.user;

  // Reject immediately if payment gateway is not configured
  if (!isRazorpayConfigured) {
    return res.status(503).json({
      success: false,
      message: 'Payment gateway is not configured. Please contact your society admin to set up online payments.',
      code: 'GATEWAY_NOT_CONFIGURED',
    });
  }

  const existingPayment = await Payment.findOne({ user: user._id, month, year, status: 'paid' });
  if (existingPayment) {
    return res.status(400).json({ success: false, message: 'Payment for this month already completed.' });
  }

  // ── Late Fee Calculation ──────────────────────────────────────────────────
  const today = new Date();
  const deadline = new Date(year, month - 1, 10, 23, 59, 59); // 10th of the billed month
  let lateFee = 0;
  if (today > deadline) {
    // ₹50 per day late after the 10th
    const daysLate = Math.ceil((today - deadline) / (1000 * 60 * 60 * 24));
    lateFee = daysLate * 50;
  }
  const totalAmountToPay = amount + lateFee;

  const receiptId = `rcpt_${user._id}_${month}_${year}`;
  const currency = 'INR';

  const options = {
    amount: totalAmountToPay * 100, // in paise
    currency,
    receipt: receiptId,
    notes: {
      userId: user._id.toString(),
      flatNumber: user.flatNumber || '',
      month: month.toString(),
      year: year.toString(),
    },
  };

  const order = await razorpay.orders.create(options);

  await Payment.findOneAndUpdate(
    { society: user.society, user: user._id, month, year },
    {
      society: user.society,
      user: user._id,
      amount,
      lateFee,
      month,
      year,
      status: 'pending',
      razorpayOrderId: order.id,
      receipt: receiptId,
      flatNumber: user.flatNumber,
      wing: user.wing,
    },
    { upsert: true, new: true }
  );

  res.status(200).json({
    success: true,
    data: {
      orderId: order.id,
      amount: totalAmountToPay * 100,
      currency,
      keyId: RAZORPAY_KEY_ID,
      lateFee,
      userInfo: { name: user.name, email: user.email, phone: user.phone },
    },
  });
};

// @desc    Verify payment signature securely
// @route   POST /api/payments/verify
const verifyPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, month, year } = req.body;

  if (!isRazorpayConfigured) {
    return res.status(503).json({
      success: false,
      message: 'Payment gateway is not configured.',
      code: 'GATEWAY_NOT_CONFIGURED',
    });
  }

  const expectedSignature = crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  // Secure timing-safe compare
  const isSignatureValid = crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'utf8'),
    Buffer.from(razorpay_signature, 'utf8')
  );

  if (!isSignatureValid) {
    return res.status(400).json({ success: false, message: 'Payment verification failed. Invalid signature.' });
  }

  const payment = await Payment.findOneAndUpdate(
    { razorpayOrderId: razorpay_order_id },
    {
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      status: 'paid',
      paidAt: new Date(),
    },
    { new: true }
  );

  if (!payment) return res.status(404).json({ success: false, message: 'Payment record not found' });

  await createNotification({
    userId: req.user._id,
    title: 'Payment Successful',
    message: `Maintenance payment for ${month}/${year} of ₹${(payment.amount + payment.lateFee)} received.`,
    type: 'payment_success',
    link: '/resident/payments',
    relatedId: payment._id,
    relatedModel: 'Payment',
  });

  await logAction(req.user._id, 'payment.success', 'Payment', payment._id, {
    amount: payment.amount,
    lateFee: payment.lateFee,
    month, year
  }, req);

  res.status(200).json({ success: true, message: 'Payment verified successfully', data: payment });
};

// @desc    Download PDF Invoice
// @route   GET /api/payments/:id/invoice
const downloadInvoice = async (req, res) => {
  const payment = await Payment.findById(req.params.id);
  if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });

  // Only owner or admin can download
  if (payment.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized to download this invoice' });
  }

  if (payment.status !== 'paid') {
    return res.status(400).json({ success: false, message: 'Invoice only available for paid payments' });
  }

  const user = await User.findById(payment.user);
  
  // Stream the PDF back to client
  generateInvoicePDF(payment, user, res);
};

// @desc    Get my payment history
// @route   GET /api/payments/history
const getMyPayments = async (req, res) => {
  const payments = await Payment.find({ society: req.user.society, user: req.user._id }).sort({ year: -1, month: -1 });
  res.status(200).json({ success: true, data: payments });
};

// @desc    Get all payments (Admin)
// @route   GET /api/payments
const getAllPayments = async (req, res) => {
  const { month, year, status, page = 1, limit = 30 } = req.query;
  const query = { society: req.user.society };
  if (month) query.month = parseInt(month);
  if (year) query.year = parseInt(year);
  if (status) query.status = status;

  const payments = await Payment.find(query)
    .populate('user', 'name email flatNumber wing phone')
    .sort({ year: -1, month: -1, createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const count = await Payment.countDocuments(query);
  const aggregate = await Payment.aggregate([
    { $match: { ...query, status: 'paid' } },
    { $group: { _id: null, total: { $sum: { $add: ['$amount', '$lateFee'] } } } },
  ]);

  res.status(200).json({
    success: true,
    count,
    pages: Math.ceil(count / limit),
    totalCollected: aggregate[0]?.total || 0,
    data: payments,
  });
};

// @desc    Get defaulters list (Admin)
// @route   GET /api/payments/defaulters
const getDefaulters = async (req, res) => {
  const { month, year } = req.query;
  const currentMonth = month ? parseInt(month) : new Date().getMonth() + 1;
  const currentYear = year ? parseInt(year) : new Date().getFullYear();

  const residents = await User.find({ society: req.user.society, role: 'resident', isActive: true }).select('name email flatNumber wing phone');
  const paidPayments = await Payment.find({ society: req.user.society, month: currentMonth, year: currentYear, status: 'paid' }).select('user');
  const paidUserIds = paidPayments.map((p) => p.user.toString());
  const defaulters = residents.filter((r) => !paidUserIds.includes(r._id.toString()));

  res.status(200).json({
    success: true,
    count: defaulters.length,
    data: defaulters,
    month: currentMonth,
    year: currentYear,
  });
};

const { sendFast2SMS } = require('../services/whatsappService');

// @desc    Send payment reminders to defaulters
// @route   POST /api/payments/remind
const sendReminders = async (req, res) => {
  const { month, year, amount } = req.body;

  const residents = await User.find({ society: req.user.society, role: 'resident', isActive: true });
  const paidPayments = await Payment.find({ society: req.user.society, month, year, status: 'paid' }).select('user');
  const paidUserIds = paidPayments.map((p) => p.user.toString());
  const defaulters = residents.filter((r) => !paidUserIds.includes(r._id.toString()));

  const emailPromises = defaulters.map(async (user) => {
    const paymentObj = { month, year, amount };
    
    // Send Email
    await sendMaintenanceReminder(user, paymentObj).catch(() => {});
    
    // Send Fast2SMS WhatsApp/SMS
    if (user.phone) {
      const msg = `Smart Society ERP: Dear ${user.name}, your maintenance payment of ₹${amount} for ${month}/${year} is pending. Please pay to avoid late fees.`;
      await sendFast2SMS(user.phone, msg).catch(() => {});
    }

    await createNotification({
      userId: user._id,
      title: 'Maintenance Payment Due',
      message: `Your maintenance payment of ₹${amount} for ${month}/${year} is pending.`,
      type: 'payment_due',
      link: '/resident/payments',
    });
  });

  await Promise.allSettled(emailPromises);
  res.status(200).json({ success: true, message: `Reminders sent to ${defaulters.length} defaulters via Email & SMS/WhatsApp.` });
};

module.exports = { createOrder, verifyPayment, downloadInvoice, getMyPayments, getAllPayments, getDefaulters, sendReminders };
