const express = require('express');
const router = express.Router();
const { getDocuments, uploadDocument, deleteDocument } = require('../controllers/documentController');
const { protect } = require('../middleware/auth');
const { uploadDocument: uploadMiddleware } = require('../config/cloudinary');

router.use(protect);

router.get('/', getDocuments);
// uploadMiddleware.single('file') will look for multipart/form-data field named 'file'
router.post('/', uploadMiddleware.single('file'), uploadDocument);
router.delete('/:id', deleteDocument);

module.exports = router;
