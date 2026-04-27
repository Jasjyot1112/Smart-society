const Expense = require('../models/Expense');

// @desc    Add expense (Admin)
// @route   POST /api/expenses
const addExpense = async (req, res) => {
  const { category, title, amount, description, date, vendor, isRecurring } = req.body;

  const expenseData = {
    society: req.user.society,
    category, title, amount, description,
    date: date || new Date(),
    vendor, isRecurring,
    addedBy: req.user._id,
  };

  if (req.file) {
    expenseData.receipt = {
      url: req.file.path,
      publicId: req.file.filename,
    };
  }

  const expense = await Expense.create(expenseData);
  await expense.populate('addedBy', 'name');

  res.status(201).json({ success: true, data: expense });
};

// @desc    Get all expenses
// @route   GET /api/expenses
const getExpenses = async (req, res) => {
  const { month, year, category, page = 1, limit = 20 } = req.query;
  const query = { society: req.user.society };
  if (month) query.month = parseInt(month);
  if (year) query.year = parseInt(year);
  if (category) query.category = category;

  const expenses = await Expense.find(query)
    .populate('addedBy', 'name')
    .sort({ date: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const count = await Expense.countDocuments(query);
  const totalAmount = await Expense.aggregate([
    { $match: query },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);

  res.status(200).json({
    success: true,
    count,
    pages: Math.ceil(count / limit),
    total: totalAmount[0]?.total || 0,
    data: expenses,
  });
};

// @desc    Get expense summary/analytics
// @route   GET /api/expenses/summary?year=
const getExpenseSummary = async (req, res) => {
  const year = parseInt(req.query.year) || new Date().getFullYear();

  // By category
  const byCategory = await Expense.aggregate([
    { $match: { society: req.user.society, year } },
    { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    { $sort: { total: -1 } },
  ]);

  // By month
  const byMonth = await Expense.aggregate([
    { $match: { society: req.user.society, year } },
    { $group: { _id: '$month', total: { $sum: '$amount' } } },
    { $sort: { _id: 1 } },
  ]);

  // Monthly data with all 12 months
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const found = byMonth.find((m) => m._id === i + 1);
    return { month: i + 1, total: found ? found.total : 0 };
  });

  const grandTotal = byCategory.reduce((sum, c) => sum + c.total, 0);

  res.status(200).json({ success: true, data: { byCategory, byMonth: monthlyData, grandTotal, year } });
};

// @desc    Update expense (Admin)
// @route   PUT /api/expenses/:id
const updateExpense = async (req, res) => {
  const expense = await Expense.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
  res.status(200).json({ success: true, data: expense });
};

// @desc    Delete expense (Admin)
// @route   DELETE /api/expenses/:id
const deleteExpense = async (req, res) => {
  const expense = await Expense.findByIdAndDelete(req.params.id);
  if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
  res.status(200).json({ success: true, message: 'Expense deleted' });
};

module.exports = { addExpense, getExpenses, getExpenseSummary, updateExpense, deleteExpense };
