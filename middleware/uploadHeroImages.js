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

// Configure multer for hero image fields
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
  },
  fileFilter: fileFilter
});

// Middleware for uploading hero image fields
const uploadHeroImages = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'mobileImage', maxCount: 1 }
]);

// Middleware to handle hero image uploads to Cloudinary
const handleHeroImageUpload = async (req, res, next) => {
  try {
    // For updates, files are optional
    if (!req.files) {
      req.cloudinaryData = null;
      return next();
    }

    const { image, mobileImage } = req.files;
    const cloudinaryData = {};

    // Upload web image if provided
    if (image && image[0]) {
      const imageResult = await uploadImage(image[0], 'hero-images');
      cloudinaryData.image = {
        public_id: imageResult.public_id,
        url: imageResult.secure_url
      };
    }

    // Upload mobile image if provided
    if (mobileImage && mobileImage[0]) {
      const mobileImageResult = await uploadImage(mobileImage[0], 'hero-images');
      cloudinaryData.mobileImage = {
        public_id: mobileImageResult.public_id,
        url: mobileImageResult.secure_url
      };
    }

    // Add Cloudinary data to request (null if no files uploaded)
    req.cloudinaryData = Object.keys(cloudinaryData).length > 0 ? cloudinaryData : null;

    next();
  } catch (error) {
    console.error('Hero image upload error:', error);
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
        message: 'Unexpected field. Only image and mobileImage are allowed.'
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
  uploadHeroImages,
  handleHeroImageUpload,
  handleUploadError
};
