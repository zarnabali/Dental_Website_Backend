const multer = require('multer');
const path = require('path');
const { cloudinary } = require('../config/cloudinary');

// Configure multer for memory storage (for Cloudinary)
const storage = multer.memoryStorage();

// File filter for videos only
const fileFilter = (req, file, cb) => {
  const allowedTypes = /mp4|avi|mov|wmv|flv|webm|mkv/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = file.mimetype.startsWith('video/');

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only video files are allowed!'));
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit for videos
  },
  fileFilter: fileFilter
});

// Middleware for single video upload
const uploadSingleVideo = upload.single('video');

// Middleware for multiple video upload
const uploadMultipleVideos = upload.array('videos', 3);

// Middleware to handle video upload to Cloudinary
const handleVideoUpload = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No video file provided'
      });
    }

    // Upload video to Cloudinary
    const result = await cloudinary.uploader.upload(
      `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
      {
        folder: 'hero-videos',
        resource_type: 'video',
        quality: 'auto',
        fetch_format: 'auto'
      }
    );
    
    // Add Cloudinary data to request
    req.cloudinaryData = {
      public_id: result.public_id,
      url: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
      duration: result.duration
    };

    next();
  } catch (error) {
    console.error('Video upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload video'
    });
  }
};

// Error handling middleware for multer
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 100MB.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum is 3 files.'
      });
    }
  }
  
  if (error.message === 'Only video files are allowed!') {
    return res.status(400).json({
      success: false,
      message: 'Only video files are allowed!'
    });
  }
  
  next(error);
};

module.exports = {
  uploadSingleVideo,
  uploadMultipleVideos,
  handleVideoUpload,
  handleUploadError
};
