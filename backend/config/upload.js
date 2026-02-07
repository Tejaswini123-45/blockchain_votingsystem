/**
 * Upload Configuration
 * @description Multer setup for file uploads (ID cards)
 * @version 1.0.0
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// =============================================================================
// STORAGE CONFIGURATION
// =============================================================================

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '..', 'uploads', 'id-cards');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

/**
 * Disk storage configuration for local file storage
 */
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: userId_timestamp_randomhash.ext
    const userId = req.user?.userId || 'unknown';
    const timestamp = Date.now();
    const randomHash = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();
    
    const filename = `${userId}_${timestamp}_${randomHash}${ext}`;
    cb(null, filename);
  },
});

/**
 * Memory storage for Cloudinary uploads
 */
const memoryStorage = multer.memoryStorage();

// =============================================================================
// FILE FILTER
// =============================================================================

/**
 * Filter allowed file types (images only)
 */
const imageFileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
  ];

  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPG, PNG, WEBP) are allowed'), false);
  }
};

// =============================================================================
// UPLOAD CONFIGURATIONS
// =============================================================================

/**
 * ID Card upload configuration (local storage)
 * Max file size: 5MB
 */
exports.uploadIdCard = multer({
  storage: diskStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1,
  },
  fileFilter: imageFileFilter,
}).single('idCard');

/**
 * ID Card upload for Cloudinary (memory storage)
 */
exports.uploadIdCardCloudinary = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1,
  },
  fileFilter: imageFileFilter,
}).single('idCard');

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Delete file from disk
 * @param {string} filePath - Path to the file
 */
exports.deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️ Deleted file: ${filePath}`);
    }
  } catch (error) {
    console.error('❌ Error deleting file:', error);
  }
};

/**
 * Get full path for an ID card file
 * @param {string} filename - Filename
 * @returns {string} - Full path
 */
exports.getIdCardPath = (filename) => {
  return path.join(uploadsDir, filename);
};

/**
 * Get public URL for an ID card (for serving via express.static)
 * @param {string} filename - Filename
 * @returns {string} - Public URL path
 */
exports.getIdCardUrl = (filename) => {
  return `/uploads/id-cards/${filename}`;
};

// Export uploads directory path
exports.uploadsDir = uploadsDir;
