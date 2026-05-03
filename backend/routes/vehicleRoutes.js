const express = require('express');
const router = express.Router();
const { getMyVehicles, addVehicle, removeVehicle, searchVehicle } = require('../controllers/vehicleController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/my', authorize('resident'), getMyVehicles);
router.post('/', authorize('resident'), addVehicle);
router.delete('/:id', authorize('resident'), removeVehicle);
router.get('/search', authorize('security', 'admin'), searchVehicle);

module.exports = router;
