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

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: fileFilter
});

// Middleware for single image upload
const uploadSingleImage = upload.single('image');

// Middleware for multiple image upload
const uploadMultipleImages = upload.array('images', 5);

// Middleware to handle image upload to Cloudinary
const handleImageUpload = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    console.log('Uploading image:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    // Upload image to Cloudinary
    const result = await uploadImage(req.file, 'images');
    
    console.log('Image upload successful:', {
      public_id: result.public_id,
      url: result.secure_url
    });
    
    // Add Cloudinary data to request
    req.cloudinaryData = {
      public_id: result.public_id,
      url: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes
    };

    next();
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload image',
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
        message: 'File too large. Maximum size is 10MB.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum is 5 files.'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected field. Please use "image" as the field name for file uploads.'
      });
    }
  }
  
  if (error.message === 'Only image files are allowed!') {
    return res.status(400).json({
      success: false,
      message: 'Only image files are allowed!'
    });
  }
  
  // Handle unexpected field errors
  if (error.message === 'Unexpected field') {
    return res.status(400).json({
      success: false,
      message: 'Unexpected field. Please use "image" as the field name for file uploads.'
    });
  }
  
  next(error);
};

module.exports = {
  uploadSingleImage,
  uploadMultipleImages,
  handleImageUpload,
  handleUploadError
};
