const Service = require('../models/Service');

// @desc    Create a new service listing
// @route   POST /api/services
const createService = async (req, res) => {
  const { name, contact, category, description } = req.body;

  const service = await Service.create({
    society: req.user.society,
    name,
    contact,
    category,
    description,
    createdBy: req.user._id,
  });

  res.status(201).json({ success: true, data: service });
};

// @desc    Get all services
// @route   GET /api/services
const getServices = async (req, res) => {
  const { category, search } = req.query;
  const query = { society: req.user.society };

  if (category) query.category = category;
  if (search) query.$text = { $search: search };

  const services = await Service.find(query)
    .sort({ category: 1, name: 1 });

  res.status(200).json({ success: true, data: services });
};

// @desc    Delete service
// @route   DELETE /api/services/:id
const deleteService = async (req, res) => {
  const service = await Service.findOne({ _id: req.params.id, society: req.user.society });
  
  if (!service) return res.status(404).json({ success: false, message: 'Service not found' });
  
  if (service.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized to delete this service' });
  }
  
  await service.deleteOne();
  res.status(200).json({ success: true, message: 'Service deleted successfully' });
};

module.exports = { createService, getServices, deleteService };
