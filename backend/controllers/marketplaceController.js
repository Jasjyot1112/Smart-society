const MarketplaceItem = require('../models/MarketplaceItem');
const { createNotification } = require('../services/notificationService');
const { broadcast } = require('../config/socket');

// @desc    Create a new marketplace item
// @route   POST /api/marketplace
const createItem = async (req, res) => {
  const { title, description, price, category, contactPhone, contactEmail, showContact } = req.body;

  const images = [];
  if (req.files && req.files.length > 0) {
    req.files.forEach((file) => {
      images.push({
        url: `http://localhost:${process.env.PORT || 5000}/uploads/${file.filename}`,
        publicId: file.filename,
      });
    });
  }

  const item = await MarketplaceItem.create({
    society: req.user.society,
    title,
    description,
    price,
    category,
    images,
    sellerId: req.user._id,
    contactInfo: {
      phone: contactPhone || req.user.phone,
      email: contactEmail || req.user.email,
      showContact: showContact !== undefined ? showContact : true,
    },
  });

  await item.populate('sellerId', 'name wing flatNumber phone email');

  // Trigger notification
  broadcast('notification', {
    title: 'New Marketplace Item',
    message: `${req.user.name} listed a ${category}: ${title}`,
    type: 'general',
    link: '/resident/marketplace'
  });

  res.status(201).json({ success: true, data: item });
};

// @desc    Get all marketplace items
// @route   GET /api/marketplace
const getItems = async (req, res) => {
  const { category, search, status, page = 1, limit = 20 } = req.query;
  const query = { society: req.user.society };

  if (category) query.category = category;
  if (status) query.status = status;
  if (search) query.$text = { $search: search };

  const items = await MarketplaceItem.find(query)
    .populate('sellerId', 'name wing flatNumber')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const count = await MarketplaceItem.countDocuments(query);

  res.status(200).json({
    success: true,
    count,
    pages: Math.ceil(count / limit),
    data: items,
  });
};

// @desc    Get single marketplace item
// @route   GET /api/marketplace/:id
const getItem = async (req, res) => {
  const item = await MarketplaceItem.findOne({ _id: req.params.id, society: req.user.society })
    .populate('sellerId', 'name email phone wing flatNumber');
  
  if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
  res.status(200).json({ success: true, data: item });
};

// @desc    Update item (or mark as sold)
// @route   PATCH /api/marketplace/:id
const updateItem = async (req, res) => {
  let item = await MarketplaceItem.findOne({ _id: req.params.id, society: req.user.society });
  
  if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
  
  // Only seller or admin can update
  if (item.sellerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized to update this item' });
  }

  item = await MarketplaceItem.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  res.status(200).json({ success: true, data: item });
};

// @desc    Delete item
// @route   DELETE /api/marketplace/:id
const deleteItem = async (req, res) => {
  const item = await MarketplaceItem.findOne({ _id: req.params.id, society: req.user.society });
  
  if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
  
  if (item.sellerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized to delete this item' });
  }

  await item.deleteOne();
  res.status(200).json({ success: true, message: 'Item deleted successfully' });
};

module.exports = { createItem, getItems, getItem, updateItem, deleteItem };
