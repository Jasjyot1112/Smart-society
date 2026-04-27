const express = require('express');
const router = express.Router();
const {
  createService, getServices, deleteService
} = require('../controllers/serviceController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.post('/', createService);
router.get('/', getServices);
router.delete('/:id', deleteService);

module.exports = router;
