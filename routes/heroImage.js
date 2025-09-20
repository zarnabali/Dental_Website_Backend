const express = require('express');
const { body, validationResult } = require('express-validator');
const HeroImage = require('../models/HeroImage');
const auth = require('../middleware/auth');
const { uploadSingleImage, handleImageUpload, handleUploadError } = require('../middleware/uploadImage');
const { uploadHeroImages, handleHeroImageUpload, handleUploadError: handleHeroUploadError } = require('../middleware/uploadHeroImages');
const { deleteImage } = require('../config/cloudinary');

const router = express.Router();

/**
 * @swagger
 * /api/hero-images:
 *   get:
 *     summary: Get all hero images
 *     tags: [Hero Images]
 *     responses:
 *       200:
 *         description: Hero images retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 3
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/HeroImage'
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
  try {
    const heroImages = await HeroImage.find({ isActive: true }).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: heroImages.length,
      data: heroImages
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
 * /api/hero-images/{id}:
 *   get:
 *     summary: Get single hero image by ID
 *     tags: [Hero Images]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Hero Image ID
 *     responses:
 *       200:
 *         description: Hero image retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/HeroImage'
 *       404:
 *         description: Hero image not found
 *       500:
 *         description: Server error
 */
router.get('/:id', async (req, res) => {
  try {
    const heroImage = await HeroImage.findById(req.params.id);
    
    if (!heroImage) {
      return res.status(404).json({
        success: false,
        message: 'Hero image not found'
      });
    }
    
    res.json({
      success: true,
      data: heroImage
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
 * /api/hero-images:
 *   post:
 *     summary: Create new hero image
 *     tags: [Hero Images]
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
 *               - mobileImage
 *               - title
 *               - description
 *               - textColor
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Hero image file for web
 *               mobileImage:
 *                 type: string
 *                 format: binary
 *                 description: Hero image file for mobile
 *               title:
 *                 type: string
 *                 maxLength: 100
 *                 example: "Welcome to Our Dental Clinic"
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 example: "Professional dental care for your family"
 *               textColor:
 *                 type: string
 *                 pattern: '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$'
 *                 example: "#FFFFFF"
 *     responses:
 *       201:
 *         description: Hero image created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/HeroImage'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/', auth, uploadHeroImages, handleHeroUploadError, handleHeroImageUpload, [
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

    const heroImage = await HeroImage.create({
      image: {
        public_id: req.cloudinaryData.image.public_id,
        url: req.cloudinaryData.image.url
      },
      mobileImage: {
        public_id: req.cloudinaryData.mobileImage.public_id,
        url: req.cloudinaryData.mobileImage.url
      },
      title,
      description,
      textColor
    });

    res.status(201).json({
      success: true,
      data: heroImage
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
 * /api/hero-images/{id}:
 *   put:
 *     summary: Update hero image (comprehensive - text and images)
 *     description: |
 *       Comprehensive update route that handles both text fields and image uploads in a single request.
 *       - Text fields (title, description, textColor) are always updated
 *       - Images are only updated if new files are provided
 *       - Supports partial updates (text only, images only, or both)
 *     tags: [Hero Images]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Hero Image ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - textColor
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 100
 *                 minLength: 1
 *                 example: "Updated Welcome Message"
 *                 description: Hero image title
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 minLength: 1
 *                 example: "Updated comprehensive dental care description"
 *                 description: Hero image description
 *               textColor:
 *                 type: string
 *                 pattern: '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$'
 *                 example: "#FFFFFF"
 *                 description: Text color for overlay text (HEX format)
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: |
 *                   Hero image file for web display (optional)
 *                   - Supported formats: JPG, PNG, GIF, WebP, SVG
 *                   - Maximum size: 10MB
 *                   - If provided, replaces existing web image
 *               mobileImage:
 *                 type: string
 *                 format: binary
 *                 description: |
 *                   Hero image file for mobile display (optional)
 *                   - Supported formats: JPG, PNG, GIF, WebP, SVG
 *                   - Maximum size: 10MB
 *                   - If provided, replaces existing mobile image
 *               isActive:
 *                 type: boolean
 *                 example: true
 *                 description: Whether the hero image is active
 *           examples:
 *             textOnly:
 *               summary: Text fields only
 *               value:
 *                 title: "Welcome to Our Clinic"
 *                 description: "Professional dental care for your family"
 *                 textColor: "#FFFFFF"
 *             withImages:
 *               summary: Text and images
 *               value:
 *                 title: "Welcome to Our Clinic"
 *                 description: "Professional dental care for your family"
 *                 textColor: "#FFFFFF"
 *                 image: "[binary file data]"
 *                 mobileImage: "[binary file data]"
 *     responses:
 *       200:
 *         description: Hero image updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/HeroImage'
 *             examples:
 *               success:
 *                 summary: Successful update
 *                 value:
 *                   success: true
 *                   data:
 *                     _id: "64f1a2b3c4d5e6f7g8h9i0j1"
 *                     title: "Updated Welcome Message"
 *                     description: "Updated description"
 *                     textColor: "#FFFFFF"
 *                     image:
 *                       public_id: "hero-images/web_image_123"
 *                       url: "https://res.cloudinary.com/example/image/upload/v1234567890/hero-images/web_image_123.jpg"
 *                     mobileImage:
 *                       public_id: "hero-images/mobile_image_456"
 *                       url: "https://res.cloudinary.com/example/image/upload/v1234567890/hero-images/mobile_image_456.jpg"
 *                     isActive: true
 *                     createdAt: "2023-09-01T10:00:00.000Z"
 *                     updatedAt: "2023-09-01T12:00:00.000Z"
 *       400:
 *         description: Validation error or bad request
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
 *                   example: "Validation failed"
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       field:
 *                         type: string
 *                         example: "title"
 *                       message:
 *                         type: string
 *                         example: "Title must be between 1 and 100 characters"
 *             examples:
 *               validationError:
 *                 summary: Validation error
 *                 value:
 *                   success: false
 *                   message: "Validation failed"
 *                   errors:
 *                     - field: "title"
 *                       message: "Title must be between 1 and 100 characters"
 *                     - field: "textColor"
 *                       message: "Text color must be a valid HEX color code"
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
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
 *                   example: "Access denied. No token provided."
 *       404:
 *         description: Hero image not found
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
 *                   example: "Hero image not found"
 *       500:
 *         description: Server error
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
 *                   example: "Server error"
 */
// Comprehensive update route that handles both text and images
router.put('/:id', auth, uploadHeroImages, handleHeroUploadError, handleHeroImageUpload, [
  body('title').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Title must be between 1 and 100 characters'),
  body('description').optional().trim().isLength({ min: 1, max: 500 }).withMessage('Description must be between 1 and 500 characters'),
  body('textColor').optional().matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).withMessage('Text color must be a valid HEX color code'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
], async (req, res) => {
  try {
    console.log('Hero image comprehensive update request:', {
      params: req.params,
      body: req.body,
      files: req.files,
      cloudinaryData: req.cloudinaryData
    });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const heroImage = await HeroImage.findById(req.params.id);
    if (!heroImage) {
      return res.status(404).json({
        success: false,
        message: 'Hero image not found'
      });
    }

    const updateData = { ...req.body };

    // Handle image updates if new images are provided
    if (req.cloudinaryData) {
      console.log('Updating images with cloudinary data:', req.cloudinaryData);
      
      // Delete old images from Cloudinary if new ones are provided
      if (req.cloudinaryData.image && heroImage.image?.public_id) {
        await deleteImage(heroImage.image.public_id);
      }
      if (req.cloudinaryData.mobileImage && heroImage.mobileImage?.public_id) {
        await deleteImage(heroImage.mobileImage.public_id);
      }

      // Update with new image data
      if (req.cloudinaryData.image) {
        updateData.image = {
          public_id: req.cloudinaryData.image.public_id,
          url: req.cloudinaryData.image.url
        };
      }
      if (req.cloudinaryData.mobileImage) {
        updateData.mobileImage = {
          public_id: req.cloudinaryData.mobileImage.public_id,
          url: req.cloudinaryData.mobileImage.url
        };
      }
    }

    console.log('Final update data:', updateData);

    const updatedHeroImage = await HeroImage.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    console.log('Updated hero image:', updatedHeroImage);

    res.json({
      success: true,
      data: updatedHeroImage
    });
  } catch (error) {
    console.error('Hero image update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * @swagger
 * /api/hero-images/{id}:
 *   delete:
 *     summary: Delete hero image
 *     tags: [Hero Images]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Hero Image ID
 *     responses:
 *       200:
 *         description: Hero image deleted successfully
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
 *                   example: "Hero image deleted successfully"
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Hero image not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const heroImage = await HeroImage.findById(req.params.id);
    if (!heroImage) {
      return res.status(404).json({
        success: false,
        message: 'Hero image not found'
      });
    }

    // Delete images from Cloudinary
    if (heroImage.image && heroImage.image.public_id) {
      await deleteImage(heroImage.image.public_id);
    }
    if (heroImage.mobileImage && heroImage.mobileImage.public_id) {
      await deleteImage(heroImage.mobileImage.public_id);
    }

    await HeroImage.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Hero image deleted successfully'
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
 * /api/hero-images/{id}/images:
 *   put:
 *     summary: Update hero image images only (legacy route)
 *     description: |
 *       Legacy route for updating only the images of a hero image.
 *       This route is kept for backward compatibility.
 *       For new implementations, use the main update route instead.
 *     tags: [Hero Images]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Hero Image ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Hero image file for web (optional)
 *               mobileImage:
 *                 type: string
 *                 format: binary
 *                 description: Hero image file for mobile (optional)
 *     responses:
 *       200:
 *         description: Hero image images updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/HeroImage'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Hero image not found
 *       500:
 *         description: Server error
 */
// Legacy route for updating images only (kept for backward compatibility)
router.put('/:id/images', auth, uploadHeroImages, handleHeroUploadError, handleHeroImageUpload, async (req, res) => {
  try {
    console.log('Hero image update images request (legacy):', {
      params: req.params,
      body: req.body,
      files: req.files,
      cloudinaryData: req.cloudinaryData
    });

    const heroImage = await HeroImage.findById(req.params.id);
    if (!heroImage) {
      return res.status(404).json({
        success: false,
        message: 'Hero image not found'
      });
    }

    const updateData = {};

    // Handle image updates if new images are provided
    if (req.cloudinaryData) {
      console.log('Updating images with cloudinary data:', req.cloudinaryData);
      
      // Delete old images from Cloudinary if new ones are provided
      if (req.cloudinaryData.image && heroImage.image?.public_id) {
        await deleteImage(heroImage.image.public_id);
      }
      if (req.cloudinaryData.mobileImage && heroImage.mobileImage?.public_id) {
        await deleteImage(heroImage.mobileImage.public_id);
      }

      // Update with new image data
      if (req.cloudinaryData.image) {
        updateData.image = {
          public_id: req.cloudinaryData.image.public_id,
          url: req.cloudinaryData.image.url
        };
      }
      if (req.cloudinaryData.mobileImage) {
        updateData.mobileImage = {
          public_id: req.cloudinaryData.mobileImage.public_id,
          url: req.cloudinaryData.mobileImage.url
        };
      }
    }

    console.log('Final image update data:', updateData);

    const updatedHeroImage = await HeroImage.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    console.log('Updated hero image with images:', updatedHeroImage);

    res.json({
      success: true,
      data: updatedHeroImage
    });
  } catch (error) {
    console.error('Hero image images update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * @swagger
 * /api/hero-images/{id}/test:
 *   put:
 *     summary: Test hero image update (debugging route)
 *     description: |
 *       Debugging route that returns all request data for testing purposes.
 *       This route uses the same middleware as the main update route but returns
 *       all request information instead of performing the actual update.
 *       Useful for debugging file upload and form data issues.
 *     tags: [Hero Images]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Hero Image ID
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Test Title"
 *               description:
 *                 type: string
 *                 example: "Test Description"
 *               textColor:
 *                 type: string
 *                 example: "#FFFFFF"
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Test image file for web
 *               mobileImage:
 *                 type: string
 *                 format: binary
 *                 description: Test image file for mobile
 *     responses:
 *       200:
 *         description: Test successful - returns all request data
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
 *                   example: "Test route working"
 *                 data:
 *                   type: object
 *                   properties:
 *                     params:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "64f1a2b3c4d5e6f7g8h9i0j1"
 *                     body:
 *                       type: object
 *                       example:
 *                         title: "Test Title"
 *                         description: "Test Description"
 *                         textColor: "#FFFFFF"
 *                     files:
 *                       type: object
 *                       description: Multer files object
 *                     cloudinaryData:
 *                       type: object
 *                       description: Processed Cloudinary data
 *             examples:
 *               success:
 *                 summary: Successful test
 *                 value:
 *                   success: true
 *                   message: "Test route working"
 *                   data:
 *                     params:
 *                       id: "64f1a2b3c4d5e6f7g8h9i0j1"
 *                     body:
 *                       title: "Test Title"
 *                       description: "Test Description"
 *                       textColor: "#FFFFFF"
 *                     files:
 *                       image: [{"fieldname": "image", "originalname": "test.jpg", "mimetype": "image/jpeg", "size": 12345}]
 *                       mobileImage: [{"fieldname": "mobileImage", "originalname": "test-mobile.jpg", "mimetype": "image/jpeg", "size": 9876}]
 *                     cloudinaryData:
 *                       image:
 *                         public_id: "hero-images/test_image_123"
 *                         url: "https://res.cloudinary.com/example/image/upload/v1234567890/hero-images/test_image_123.jpg"
 *                       mobileImage:
 *                         public_id: "hero-images/test_mobile_456"
 *                         url: "https://res.cloudinary.com/example/image/upload/v1234567890/hero-images/test_mobile_456.jpg"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// Test route for debugging
router.put('/:id/test', auth, uploadHeroImages, handleHeroUploadError, handleHeroImageUpload, async (req, res) => {
  try {
    console.log('Test route - Request data:', {
      params: req.params,
      body: req.body,
      files: req.files,
      cloudinaryData: req.cloudinaryData
    });

    res.json({
      success: true,
      message: 'Test route working',
      data: {
        params: req.params,
        body: req.body,
        files: req.files,
        cloudinaryData: req.cloudinaryData
      }
    });
  } catch (error) {
    console.error('Test route error:', error);
    res.status(500).json({
      success: false,
      message: 'Test route error',
      error: error.message
    });
  }
});

module.exports = router;
