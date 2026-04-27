const multer = require('multer');
const fs = require('fs');

// Ensure local uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Universal local storage fallback during development
const fallbackStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});

const uploadImage = multer({ storage: fallbackStorage, limits: { fileSize: 5 * 1024 * 1024 } });
const uploadAudio = multer({ storage: fallbackStorage, limits: { fileSize: 10 * 1024 * 1024 } });
const uploadProfile = multer({ storage: fallbackStorage, limits: { fileSize: 2 * 1024 * 1024 } });
const uploadReceipt = multer({ storage: fallbackStorage, limits: { fileSize: 5 * 1024 * 1024 } });
const uploadComplaintMedia = multer({ storage: fallbackStorage, limits: { fileSize: 10 * 1024 * 1024 } });
const uploadMarketplaceImage = multer({ storage: fallbackStorage, limits: { fileSize: 5 * 1024 * 1024 } });
const uploadAnnouncementImage = multer({ storage: fallbackStorage, limits: { fileSize: 8 * 1024 * 1024 } });

// Provide dummy cloudinary export so existing code using cloudinary.uploader doesn't crash immediately (even though we aren't using it here, other files might import it just in case)
const cloudinary = { uploader: { destroy: async () => ({ result: 'ok' }) } };

module.exports = { cloudinary, uploadImage, uploadAudio, uploadProfile, uploadReceipt, uploadComplaintMedia, uploadMarketplaceImage, uploadAnnouncementImage };
