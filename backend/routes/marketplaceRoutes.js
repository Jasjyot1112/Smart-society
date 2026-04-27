const express = require('express');
const router = express.Router();
const {
  createItem, getItems, getItem, updateItem, deleteItem
} = require('../controllers/marketplaceController');
const { protect } = require('../middleware/auth');
const { uploadMarketplaceImage } = require('../config/cloudinary');

router.use(protect);

router.post('/', uploadMarketplaceImage.array('images', 5), createItem);
router.get('/', getItems);
router.get('/:id', getItem);
router.patch('/:id', updateItem);
router.delete('/:id', deleteItem);

module.exports = router;
