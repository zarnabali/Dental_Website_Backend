const express = require('express');
const { body, validationResult } = require('express-validator');
const HeroVideo = require('../models/HeroVideo');
const auth = require('../middleware/auth');
const { uploadSingleVideo, handleVideoUpload, handleUploadError } = require('../middleware/uploadVideo');
const { cloudinary } = require('../config/cloudinary');

const router = express.Router();

/**
 * @swagger
 * /api/hero-videos:
 *   get:
 *     summary: Get hero video (only one allowed)
 *     tags: [Hero Videos]
 *     responses:
 *       200:
 *         description: Hero video retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/HeroVideo'
 *       404:
 *         description: No hero video found
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
  try {
    const heroVideo = await HeroVideo.findOne({ isActive: true }).sort({ createdAt: -1 });
    
    if (!heroVideo) {
      return res.status(404).json({
        success: false,
        message: 'No hero video found'
      });
    }
    
    res.json({
      success: true,
      data: heroVideo
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * @swagger
 * /api/hero-videos:
 *   post:
 *     summary: Create new hero video (only one allowed)
 *     tags: [Hero Videos]
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
 *               - title
 *               - description
 *               - textColor
 *             properties:
 *               video:
 *                 type: string
 *                 format: binary
 *                 description: Hero video file
 *               title:
 *                 type: string
 *                 maxLength: 100
 *                 example: "Our Dental Services"
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 example: "Watch our comprehensive dental care services"
 *               textColor:
 *                 type: string
 *                 pattern: '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$'
 *                 example: "#FFFFFF"
 *     responses:
 *       201:
 *         description: Hero video created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/HeroVideo'
 *                 message:
 *                   type: string
 *                   example: "Hero video created successfully"
 *       400:
 *         description: Validation error or limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Hero video limit exceeded. Only one hero video is allowed."
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/', auth, uploadSingleVideo, handleUploadError, handleVideoUpload, [
  body('title').trim().isLength({ min: 1, max: 100 }).withMessage('Title must be between 1 and 100 characters'),
  body('description').trim().isLength({ min: 1, max: 500 }).withMessage('Description must be between 1 and 500 characters'),
  body('textColor').matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).withMessage('Text color must be a valid HEX color code')
], async (req, res) => {
  try {
    // First validate all fields
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Check if a hero video already exists BEFORE uploading
    const existingHeroVideo = await HeroVideo.findOne({ isActive: true });
    
    if (existingHeroVideo) {
      return res.status(400).json({
        success: false,
        message: 'Hero video limit exceeded. Only one hero video is allowed. Please delete the existing one first or use the update endpoint.'
      });
    }

    const { title, description, textColor } = req.body;

    // Create new hero video using the uploaded data from middleware
    const heroVideo = await HeroVideo.create({
      video: {
        public_id: req.cloudinaryData.public_id,
        url: req.cloudinaryData.url
      },
      title,
      description,
      textColor
    });

    return res.status(201).json({
      success: true,
      data: heroVideo,
      message: 'Hero video created successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * @swagger
 * /api/hero-videos/update:
 *   put:
 *     summary: Update existing hero video
 *     tags: [Hero Videos]
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
 *               - title
 *               - description
 *               - textColor
 *             properties:
 *               video:
 *                 type: string
 *                 format: binary
 *                 description: Hero video file
 *               title:
 *                 type: string
 *                 maxLength: 100
 *                 example: "Updated Dental Services"
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 example: "Updated comprehensive dental care services"
 *               textColor:
 *                 type: string
 *                 pattern: '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$'
 *                 example: "#000000"
 *     responses:
 *       200:
 *         description: Hero video updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/HeroVideo'
 *                 message:
 *                   type: string
 *                   example: "Hero video updated successfully"
 *       400:
 *         description: Validation error or no existing hero video
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.put('/update', auth, uploadSingleVideo, handleUploadError, handleVideoUpload, [
  body('title').trim().isLength({ min: 1, max: 100 }).withMessage('Title must be between 1 and 100 characters'),
  body('description').trim().isLength({ min: 1, max: 500 }).withMessage('Description must be between 1 and 500 characters'),
  body('textColor').matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).withMessage('Text color must be a valid HEX color code')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { title, description, textColor } = req.body;

    // Check if a hero video exists
    const existingHeroVideo = await HeroVideo.findOne({ isActive: true });
    
    if (!existingHeroVideo) {
      return res.status(400).json({
        success: false,
        message: 'No hero video found to update. Please create one first.'
      });
    }

    // Delete old video from Cloudinary
    if (existingHeroVideo.video && existingHeroVideo.video.public_id) {
      await cloudinary.uploader.destroy(existingHeroVideo.video.public_id, { resource_type: 'video' });
    }

    const updatedHeroVideo = await HeroVideo.findByIdAndUpdate(
      existingHeroVideo._id,
      {
        video: {
          public_id: req.cloudinaryData.public_id,
          url: req.cloudinaryData.url
        },
        title,
        description,
        textColor
      },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      data: updatedHeroVideo,
      message: 'Hero video updated successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * @swagger
 * /api/hero-videos:
 *   delete:
 *     summary: Delete hero video
 *     tags: [Hero Videos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Hero video deleted successfully
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
 *                   example: "Hero video deleted successfully"
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Hero video not found
 *       500:
 *         description: Server error
 */
router.delete('/', auth, async (req, res) => {
  try {
    const heroVideo = await HeroVideo.findOne({ isActive: true });
    if (!heroVideo) {
      return res.status(404).json({
        success: false,
        message: 'Hero video not found'
      });
    }

    // Delete video from Cloudinary
    if (heroVideo.video && heroVideo.video.public_id) {
      await cloudinary.uploader.destroy(heroVideo.video.public_id, { resource_type: 'video' });
    }

    await HeroVideo.findByIdAndDelete(heroVideo._id);

    res.json({
      success: true,
      message: 'Hero video deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
