const express = require('express');
const router = express.Router();
const { addExpense, getExpenses, getExpenseSummary, updateExpense, deleteExpense } = require('../controllers/expenseController');
const { protect, authorize } = require('../middleware/auth');
const { uploadReceipt } = require('../config/cloudinary');

router.use(protect);

router.get('/summary', getExpenseSummary); // Accessible to all logged-in users
router.get('/', getExpenses);              // Accessible to all logged-in users
router.post('/', authorize('admin'), uploadReceipt.single('receipt'), addExpense);
router.put('/:id', authorize('admin'), updateExpense);
router.delete('/:id', authorize('admin'), deleteExpense);

module.exports = router;
