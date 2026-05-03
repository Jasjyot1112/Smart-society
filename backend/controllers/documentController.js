const Document = require('../models/Document');
const { logAction } = require('../services/auditService');

// @desc    Get all documents for user's society
// @route   GET /api/documents
const getDocuments = async (req, res) => {
  // If admin, return all society docs + all personal docs for society
  // If resident, return all society docs (isPublic=true) + their own personal docs
  
  let filter = { society: req.user.society };

  if (req.user.role === 'resident') {
    filter = {
      society: req.user.society,
      $or: [
        { category: 'society', isPublic: true },
        { category: 'personal', resident: req.user._id }
      ]
    };
  }

  const documents = await Document.find(filter)
    .populate('uploadedBy', 'name')
    .populate('resident', 'name flatNumber wing')
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, count: documents.length, data: documents });
};

// @desc    Upload a new document
// @route   POST /api/documents
const uploadDocument = async (req, res) => {
  const { title, description, category, residentId, isPublic } = req.body;

  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Please upload a file' });
  }

  // File is saved in uploads/ directory by multer
  const fileUrl = `${process.env.BACKEND_URL || 'http://localhost:5000'}/uploads/${req.file.filename}`;
  
  // Basic fileType extraction
  const ext = req.file.originalname.split('.').pop().toLowerCase();
  const fileType = ['pdf'].includes(ext) ? 'pdf' : ['jpg', 'jpeg', 'png'].includes(ext) ? 'image' : 'other';

  const docData = {
    society: req.user.society,
    title,
    description,
    fileUrl,
    fileType,
    category,
    uploadedBy: req.user._id,
    isPublic: isPublic === 'true' || isPublic === true,
  };

  if (category === 'personal') {
    docData.resident = residentId || req.user._id; // Admin can specify resident, else defaults to uploader
  }

  const document = await Document.create(docData);

  await logAction(req.user._id, 'document.uploaded', 'Document', document._id, { title, category }, req);

  res.status(201).json({ success: true, data: document });
};

// @desc    Delete a document
// @route   DELETE /api/documents/:id
const deleteDocument = async (req, res) => {
  const document = await Document.findById(req.params.id);
  
  if (!document) {
    return res.status(404).json({ success: false, message: 'Document not found' });
  }

  // Authorization check
  if (req.user.role !== 'admin' && document.uploadedBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized to delete this document' });
  }

  // We could delete the physical file from uploads folder here, 
  // but for safety in this scope we'll just remove the DB record.
  await document.deleteOne();

  await logAction(req.user._id, 'document.deleted', 'Document', document._id, { title: document.title }, req);

  res.status(200).json({ success: true, data: {} });
};

module.exports = { getDocuments, uploadDocument, deleteDocument };
