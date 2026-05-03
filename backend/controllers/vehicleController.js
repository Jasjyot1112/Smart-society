const Vehicle = require('../models/Vehicle');
const { logAction } = require('../services/auditService');

// @desc    Get vehicles for a resident
// @route   GET /api/vehicles/my
const getMyVehicles = async (req, res) => {
  const vehicles = await Vehicle.find({ resident: req.user._id, isActive: true });
  res.status(200).json({ success: true, count: vehicles.length, data: vehicles });
};

// @desc    Add a vehicle (Resident)
// @route   POST /api/vehicles
const addVehicle = async (req, res) => {
  const { licensePlate, type, makeModel, color } = req.body;

  // Check if plate already exists in society
  const existing = await Vehicle.findOne({ society: req.user.society, licensePlate: licensePlate.toUpperCase() });
  if (existing) {
    return res.status(400).json({ success: false, message: 'This license plate is already registered.' });
  }

  const vehicle = await Vehicle.create({
    society: req.user.society,
    resident: req.user._id,
    flatNumber: req.user.flatNumber,
    wing: req.user.wing,
    licensePlate,
    type,
    makeModel,
    color,
  });

  await logAction(req.user._id, 'vehicle.added', 'Vehicle', vehicle._id, { licensePlate }, req);

  res.status(201).json({ success: true, data: vehicle });
};

// @desc    Remove a vehicle (Resident)
// @route   DELETE /api/vehicles/:id
const removeVehicle = async (req, res) => {
  const vehicle = await Vehicle.findOne({ _id: req.params.id, resident: req.user._id });
  if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });

  vehicle.isActive = false;
  await vehicle.save();

  await logAction(req.user._id, 'vehicle.removed', 'Vehicle', vehicle._id, { licensePlate: vehicle.licensePlate }, req);

  res.status(200).json({ success: true, data: {} });
};

// @desc    Search vehicle by license plate (Security)
// @route   GET /api/vehicles/search
const searchVehicle = async (req, res) => {
  const { plate } = req.query;
  if (!plate) return res.status(400).json({ success: false, message: 'Please provide a license plate' });

  const vehicle = await Vehicle.findOne({
    society: req.user.society,
    licensePlate: { $regex: new RegExp(plate, 'i') },
    isActive: true
  }).populate('resident', 'name phone flatNumber wing');

  if (!vehicle) {
    return res.status(404).json({ success: false, message: 'No registered vehicle found with this plate' });
  }

  res.status(200).json({ success: true, data: vehicle });
};

module.exports = { getMyVehicles, addVehicle, removeVehicle, searchVehicle };
