const multer = require('multer');
const path = require('path');
const { uploadImage } = require('../config/cloudinary');

// Configure multer for memory storage (for Cloudinary)
const storage = multer.memoryStorage();

// File filter for images only
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

// Configure multer for multiple specific fields
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
  },
  fileFilter: fileFilter
});

// Middleware for uploading multiple specific image fields
const uploadMultipleSpecificImages = upload.fields([
  { name: 'cardImage', maxCount: 1 },
  { name: 'heroImage', maxCount: 1 }
]);

// Middleware to handle multiple image uploads to Cloudinary
const handleMultipleImageUpload = async (req, res, next) => {
  try {
    if (!req.files) {
      return res.status(400).json({
        success: false,
        message: 'No image files provided'
      });
    }

    const { cardImage, heroImage } = req.files;

    if (!cardImage || !heroImage) {
      return res.status(400).json({
        success: false,
        message: 'Both cardImage and heroImage are required'
      });
    }

    // Upload card image
    const cardImageResult = await uploadImage(cardImage[0], 'services');
    
    // Upload hero image
    const heroImageResult = await uploadImage(heroImage[0], 'services');

    // Add Cloudinary data to request
    req.cloudinaryData = {
      cardImage: {
        public_id: cardImageResult.public_id,
        url: cardImageResult.secure_url
      },
      heroImage: {
        public_id: heroImageResult.public_id,
        url: heroImageResult.secure_url
      }
    };

    next();
  } catch (error) {
    console.error('Multiple image upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload images',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Error handling middleware for multer
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 10MB per file.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum is 1 file per field.'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected field. Only cardImage and heroImage are allowed.'
      });
    }
  }
  
  if (error.message === 'Only image files are allowed!') {
    return res.status(400).json({
      success: false,
      message: 'Only image files are allowed!'
    });
  }
  
  next(error);
};

module.exports = {
  uploadMultipleSpecificImages,
  handleMultipleImageUpload,
  handleUploadError
};
