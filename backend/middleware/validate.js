const { body, param, query, validationResult } = require('express-validator');

// Middleware to check validation results
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// ─── Auth ────────────────────────────────────────────────────────────────────
const validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  handleValidation,
];

const validateRegister = [
  body('name').trim().isLength({ min: 2, max: 60 }).withMessage('Name must be 2-60 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['admin', 'resident', 'security']).withMessage('Invalid role'),
  body('flatNumber').if(body('role').equals('resident')).notEmpty().withMessage('Flat number required for residents'),
  handleValidation,
];

// ─── Booking ─────────────────────────────────────────────────────────────────
const validateCreateBooking = [
  body('facilityId').isMongoId().withMessage('Invalid facility ID'),
  body('date').isISO8601().withMessage('Valid date required (YYYY-MM-DD)'),
  body('slot.startTime').matches(/^\d{2}:\d{2}$/).withMessage('Start time must be HH:MM'),
  body('slot.endTime').matches(/^\d{2}:\d{2}$/).withMessage('End time must be HH:MM'),
  handleValidation,
];

// ─── Complaint ───────────────────────────────────────────────────────────────
const validateComplaint = [
  body('title').trim().isLength({ min: 5, max: 100 }).withMessage('Title must be 5-100 characters'),
  body('description').trim().isLength({ min: 10, max: 2000 }).withMessage('Description must be 10-2000 characters'),
  handleValidation,
];

// ─── Payment ─────────────────────────────────────────────────────────────────
const validateCreateOrder = [
  body('month').isInt({ min: 1, max: 12 }).withMessage('Month must be 1-12'),
  body('year').isInt({ min: 2020, max: 2100 }).withMessage('Invalid year'),
  body('amount').isFloat({ min: 1 }).withMessage('Amount must be positive'),
  handleValidation,
];

// ─── Visitor ─────────────────────────────────────────────────────────────────
const validateVisitorRequest = [
  body('name').trim().isLength({ min: 2, max: 60 }).withMessage('Visitor name must be 2-60 characters'),
  body('flatNumber').trim().notEmpty().withMessage('Flat number is required'),
  body('purpose').isIn(['guest', 'delivery', 'service', 'cab', 'maintenance', 'other']).withMessage('Invalid purpose'),
  body('phone').optional().isMobilePhone('any').withMessage('Invalid phone number'),
  handleValidation,
];

// ─── MongoDB ID param ─────────────────────────────────────────────────────────
const validateMongoId = (paramName = 'id') => [
  param(paramName).isMongoId().withMessage(`Invalid ${paramName}`),
  handleValidation,
];

module.exports = {
  validateLogin,
  validateRegister,
  validateCreateBooking,
  validateComplaint,
  validateCreateOrder,
  validateVisitorRequest,
  validateMongoId,
};
