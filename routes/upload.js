const express = require('express');
const auth = require('../middleware/auth');
const { uploadSingleImage, uploadMultipleImages, handleImageUpload, handleUploadError } = require('../middleware/uploadImage');
const { uploadSingleVideo, uploadMultipleVideos, handleVideoUpload } = require('../middleware/uploadVideo');

const router = express.Router();

// Test route to check if upload endpoints are working
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Upload endpoints are working',
    endpoints: {
      singleImage: 'POST /api/upload/image',
      multipleImages: 'POST /api/upload/images',
      singleVideo: 'POST /api/upload/video',
      multipleVideos: 'POST /api/upload/videos'
    }
  });
});

/**
 * @swagger
 * /api/upload/image:
 *   post:
 *     summary: Upload single image
 *     tags: [File Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Image file (JPG, PNG, GIF, WebP, SVG)
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UploadResponse'
 *       400:
 *         description: No file provided or invalid file type
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/image', auth, uploadSingleImage, handleUploadError, handleImageUpload, (req, res) => {
  res.json({
    success: true,
    message: 'Image uploaded successfully',
    data: {
      public_id: req.cloudinaryData.public_id,
      url: req.cloudinaryData.url,
      width: req.cloudinaryData.width,
      height: req.cloudinaryData.height,
      format: req.cloudinaryData.format,
      bytes: req.cloudinaryData.bytes
    }
  });
});

/**
 * @swagger
 * /api/upload/images:
 *   post:
 *     summary: Upload multiple images
 *     tags: [File Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - images
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Multiple image files (JPG, PNG, GIF, WebP, SVG)
 *     responses:
 *       200:
 *         description: Images uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "3 images uploaded successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/UploadResponse'
 *       400:
 *         description: No files provided or invalid file types
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/images', auth, uploadMultipleImages, handleUploadError, async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No image files provided'
      });
    }

    const { uploadImage } = require('../config/cloudinary');
    const uploadPromises = req.files.map(file => uploadImage(file, 'images'));
    const results = await Promise.all(uploadPromises);

    const uploadedImages = results.map(result => ({
      public_id: result.public_id,
      url: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes
    }));

    res.json({
      success: true,
      message: `${uploadedImages.length} images uploaded successfully`,
      data: uploadedImages
    });
  } catch (error) {
    console.error('Multiple image upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload images'
    });
  }
});

/**
 * @swagger
 * /api/upload/video:
 *   post:
 *     summary: Upload single video
 *     tags: [File Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - video
 *             properties:
 *               video:
 *                 type: string
 *                 format: binary
 *                 description: Video file (MP4, MOV, AVI, WMV, FLV, WebM)
 *     responses:
 *       200:
 *         description: Video uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Video uploaded successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     public_id:
 *                       type: string
 *                       example: "videos/video_123_abc"
 *                     url:
 *                       type: string
 *                       example: "https://res.cloudinary.com/your-cloud/video/upload/v1234567890/videos/video_123_abc.mp4"
 *                     width:
 *                       type: number
 *                       example: 1920
 *                     height:
 *                       type: number
 *                       example: 1080
 *                     format:
 *                       type: string
 *                       example: "mp4"
 *                     bytes:
 *                       type: number
 *                       example: 15728640
 *                     duration:
 *                       type: number
 *                       example: 120.5
 *       400:
 *         description: No file provided or invalid file type
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/video', auth, uploadSingleVideo, handleUploadError, handleVideoUpload, (req, res) => {
  res.json({
    success: true,
    message: 'Video uploaded successfully',
    data: {
      public_id: req.cloudinaryData.public_id,
      url: req.cloudinaryData.url,
      width: req.cloudinaryData.width,
      height: req.cloudinaryData.height,
      format: req.cloudinaryData.format,
      bytes: req.cloudinaryData.bytes,
      duration: req.cloudinaryData.duration
    }
  });
});

/**
 * @swagger
 * /api/upload/videos:
 *   post:
 *     summary: Upload multiple videos
 *     tags: [File Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - videos
 *             properties:
 *               videos:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Multiple video files (MP4, MOV, AVI, WMV, FLV, WebM)
 *     responses:
 *       200:
 *         description: Videos uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "2 videos uploaded successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       public_id:
 *                         type: string
 *                         example: "videos/video_123_abc"
 *                       url:
 *                         type: string
 *                         example: "https://res.cloudinary.com/your-cloud/video/upload/v1234567890/videos/video_123_abc.mp4"
 *                       width:
 *                         type: number
 *                         example: 1920
 *                       height:
 *                         type: number
 *                         example: 1080
 *                       format:
 *                         type: string
 *                         example: "mp4"
 *                       bytes:
 *                         type: number
 *                         example: 15728640
 *                       duration:
 *                         type: number
 *                         example: 120.5
 *       400:
 *         description: No files provided or invalid file types
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/videos', auth, uploadMultipleVideos, handleUploadError, async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No video files provided'
      });
    }

    const { cloudinary } = require('../config/cloudinary');
    const uploadPromises = req.files.map(file => 
      cloudinary.uploader.upload(
        `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
        {
          folder: 'videos',
          resource_type: 'video',
          quality: 'auto',
          fetch_format: 'auto'
        }
      )
    );
    const results = await Promise.all(uploadPromises);

    const uploadedVideos = results.map(result => ({
      public_id: result.public_id,
      url: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
      duration: result.duration
    }));

    res.json({
      success: true,
      message: `${uploadedVideos.length} videos uploaded successfully`,
      data: uploadedVideos
    });
  } catch (error) {
    console.error('Multiple video upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload videos'
    });
  }
});

module.exports = router;
