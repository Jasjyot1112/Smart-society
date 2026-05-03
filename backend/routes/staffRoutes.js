const express = require('express');
const router = express.Router();
const {
  getStaffList, getStaffById, getStaffByStaffId,
  addStaff, updateStaff, deactivateStaff,
  markAttendance, getStaffSalary
} = require('../controllers/staffController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// List & create
router.get('/', authorize('admin', 'security'), getStaffList);
router.post('/', authorize('admin'), addStaff);

// QR lookup by staffId string (security scans QR)
router.get('/qr/:staffId', authorize('admin', 'security'), getStaffByStaffId);

// Single staff operations
router.get('/:id', authorize('admin'), getStaffById);
router.put('/:id', authorize('admin'), updateStaff);
router.delete('/:id', authorize('admin'), deactivateStaff);

// Attendance
router.post('/:id/attendance', authorize('admin', 'security'), markAttendance);

// Salary summary
router.get('/:id/salary', authorize('admin'), getStaffSalary);

module.exports = router;
