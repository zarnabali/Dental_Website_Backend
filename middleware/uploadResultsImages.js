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

// Configure multer for two specific image fields
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
  },
  fileFilter: fileFilter
});

// Middleware for uploading before and after images
const uploadResultsImages = upload.fields([
  { name: 'beforeImage', maxCount: 1 },
  { name: 'afterImage', maxCount: 1 }
]);

// Middleware to handle image uploads to Cloudinary
const handleResultsImagesUpload = async (req, res, next) => {
  try {
    console.log('handleResultsImagesUpload - Checking for files...');
    console.log('req.files:', req.files ? Object.keys(req.files) : 'No files object');
    
    if (!req.files) {
      console.error('No files object in request');
      return res.status(400).json({
        success: false,
        message: 'No image files provided. Please ensure both beforeImage and afterImage are included.'
      });
    }

    const { beforeImage, afterImage } = req.files;

    if (!beforeImage || !beforeImage[0]) {
      console.error('Before image missing');
      return res.status(400).json({
        success: false,
        message: 'Before image is required'
      });
    }

    if (!afterImage || !afterImage[0]) {
      console.error('After image missing');
      return res.status(400).json({
        success: false,
        message: 'After image is required'
      });
    }

    console.log('Uploading results images to Cloudinary:', {
      beforeImage: beforeImage[0].originalname,
      beforeImageSize: beforeImage[0].size,
      afterImage: afterImage[0].originalname,
      afterImageSize: afterImage[0].size
    });

    // Upload before image to Cloudinary
    console.log('Uploading before image...');
    const beforeImageResult = await uploadImage(beforeImage[0], 'results');
    console.log('Before image uploaded:', beforeImageResult.public_id);
    
    // Upload after image to Cloudinary
    console.log('Uploading after image...');
    const afterImageResult = await uploadImage(afterImage[0], 'results');
    console.log('After image uploaded:', afterImageResult.public_id);

    console.log('Results images upload successful');

    // Add Cloudinary data to request
    req.cloudinaryData = {
      beforeImage: {
        public_id: beforeImageResult.public_id,
        url: beforeImageResult.secure_url
      },
      afterImage: {
        public_id: afterImageResult.public_id,
        url: afterImageResult.secure_url
      }
    };

    next();
  } catch (error) {
    console.error('Results images upload error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to upload images to Cloudinary',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Error handling middleware for multer
const handleUploadError = (error, req, res, next) => {
  console.error('handleUploadError called with error:', error);
  console.error('Error type:', error.constructor.name);
  console.error('Error code:', error.code);
  console.error('Error message:', error.message);
  
  if (error instanceof multer.MulterError) {
    console.error('MulterError detected, code:', error.code);
    
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 10MB per file.',
        error: error.message
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Only beforeImage and afterImage are allowed.',
        error: error.message
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected field. Only beforeImage and afterImage are allowed.',
        error: error.message
      });
    }
    if (error.code === 'LIMIT_PART_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many parts in the multipart request.',
        error: error.message
      });
    }
    if (error.code === 'LIMIT_FIELD_KEY') {
      return res.status(400).json({
        success: false,
        message: 'Field name too long.',
        error: error.message
      });
    }
    if (error.code === 'LIMIT_FIELD_VALUE') {
      return res.status(400).json({
        success: false,
        message: 'Field value too long.',
        error: error.message
      });
    }
    if (error.code === 'LIMIT_FIELD_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many fields.',
        error: error.message
      });
    }
    
    // Generic multer error
    return res.status(400).json({
      success: false,
      message: 'File upload error: ' + error.message,
      error: error.code
    });
  }
  
  if (error.message === 'Only image files are allowed!') {
    return res.status(400).json({
      success: false,
      message: 'Only image files are allowed!',
      error: error.message
    });
  }
  
  // If it's not a multer error, pass it to the next error handler
  console.error('Unknown error type, passing to next error handler');
  next(error);
};

module.exports = {
  uploadResultsImages,
  handleResultsImagesUpload,
  handleUploadError
};

