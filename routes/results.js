const express = require('express');
const { body, validationResult } = require('express-validator');
const Results = require('../models/Results');
const auth = require('../middleware/auth');
const { uploadResultsImages, handleResultsImagesUpload, handleUploadError } = require('../middleware/uploadResultsImages');
const { deleteImage } = require('../config/cloudinary');

const router = express.Router();

// Log when router is created
console.log('✅ Results router created');

// Test route to verify the router is loaded (must be before the /:id route)
// This route doesn't require DB, so it can be used to test if the route is registered
router.get('/test', (req, res) => {
  console.log('✅ /api/results/test route hit - router is working!');
  res.json({
    success: true,
    message: 'Results route is working! Router is properly registered.',
    timestamp: new Date().toISOString(),
    route: '/api/results/test'
  });
});

/**
 * @swagger
 * /api/results:
 *   get:
 *     summary: Get all results (before/after images)
 *     tags: [Results]
 *     responses:
 *       200:
 *         description: Results retrieved successfully
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
 *                   example: 5
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Results'
 *       500:
 *         description: Server error
 */
// GET all results - MUST be before /:id route
router.get('/', async (req, res) => {
  try {
    console.log('✅ GET /api/results/ - Route handler called');
    console.log('Request URL:', req.originalUrl);
    console.log('Request path:', req.path);
    console.log('Request method:', req.method);
    console.log('Query params:', req.query);
    
    // Build query - filter by isActive if requested (for public API)
    // If no isActive param, return all (for dashboard)
    const query = {};
    if (req.query.active === 'true' || req.query.active === true) {
      query.isActive = true;
      console.log('Filtering by isActive: true (public API)');
    } else {
      console.log('Returning all results (dashboard mode)');
    }
    
    console.log('Querying database for results with query:', query);
    const results = await Results.find(query).sort({ createdAt: -1 });
    console.log(`✅ Found ${results.length} results in database`);
    
    res.json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error) {
    console.error('❌ Error in GET /api/results:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @swagger
 * /api/results/{id}:
 *   get:
 *     summary: Get single result by ID
 *     tags: [Results]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Result ID
 *     responses:
 *       200:
 *         description: Result retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Results'
 *       404:
 *         description: Result not found
 *       500:
 *         description: Server error
 */
router.get('/:id', async (req, res) => {
  try {
    const result = await Results.findById(req.params.id);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Result not found'
      });
    }
    
    res.json({
      success: true,
      data: result
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
 * /api/results:
 *   post:
 *     summary: Create new result (Admin only)
 *     tags: [Results]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - beforeImage
 *               - afterImage
 *               - title
 *               - description
 *             properties:
 *               beforeImage:
 *                 type: string
 *                 format: binary
 *                 description: Before treatment image
 *               afterImage:
 *                 type: string
 *                 format: binary
 *                 description: After treatment image
 *               title:
 *                 type: string
 *                 maxLength: 50
 *                 example: "Teeth Whitening Success Story"
 *                 description: Short title (4-5 words max)
 *               description:
 *                 type: string
 *                 maxLength: 100
 *                 example: "Patient achieved brighter smile after treatment"
 *                 description: Short description (7 words max)
 *     responses:
 *       201:
 *         description: Result created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Results'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// Wrapper to handle multer errors properly
const handleMulterUpload = (req, res, next) => {
  console.log('handleMulterUpload - Starting file upload parsing...');
  console.log('Content-Type:', req.headers['content-type']);
  console.log('Content-Length:', req.headers['content-length']);
  
  uploadResultsImages(req, res, (err) => {
    if (err) {
      console.error('Multer error:', err);
      console.error('Multer error code:', err.code);
      console.error('Multer error message:', err.message);
      return handleUploadError(err, req, res, next);
    }
    console.log('Multer parsing successful');
    console.log('Files parsed:', req.files ? Object.keys(req.files) : 'No files');
    console.log('Body parsed:', req.body ? Object.keys(req.body) : 'No body');
    next();
  });
};

// Validation middleware (runs after multer parses the form)
const validateResultsInput = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('Title must be between 1 and 50 characters (4-5 words max)'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Description must be between 1 and 100 characters (7 words max)'),
  // Check validation errors
  (req, res, next) => {
    console.log('Validating request body:', req.body);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    console.log('Validation passed');
    next();
  }
];

// Route handler with proper middleware chain
router.post('/', 
  auth, 
  handleMulterUpload, 
  ...validateResultsInput, 
  handleResultsImagesUpload, 
  async (req, res) => {
    try {
      console.log('POST /api/results - Creating new result');
      console.log('Request body:', req.body);
      console.log('Files received:', req.files ? Object.keys(req.files) : 'No files');
      console.log('Cloudinary data:', req.cloudinaryData ? 'Present' : 'Missing');
      
      const { title, description } = req.body;

      // Validate that we have the required data
      if (!title || !description) {
        return res.status(400).json({
          success: false,
          message: 'Title and description are required'
        });
      }

      // Check if images were uploaded to Cloudinary
      if (!req.cloudinaryData || !req.cloudinaryData.beforeImage || !req.cloudinaryData.afterImage) {
        return res.status(400).json({
          success: false,
          message: 'Image upload failed. Both beforeImage and afterImage are required.'
        });
      }

      const result = await Results.create({
        title: title.trim(),
        description: description.trim(),
        beforeImage: {
          public_id: req.cloudinaryData.beforeImage.public_id,
          url: req.cloudinaryData.beforeImage.url
        },
        afterImage: {
          public_id: req.cloudinaryData.afterImage.public_id,
          url: req.cloudinaryData.afterImage.url
        }
      });

      console.log('Result created successfully:', result._id);
      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error in POST /api/results:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * @swagger
 * /api/results/{id}:
 *   delete:
 *     summary: Delete a result (Admin only)
 *     tags: [Results]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Result ID
 *     responses:
 *       200:
 *         description: Result deleted successfully
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
 *                   example: "Result deleted successfully"
 *       404:
 *         description: Result not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await Results.findById(req.params.id);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Result not found'
      });
    }

    // Delete images from Cloudinary
    try {
      await deleteImage(result.beforeImage.public_id);
      await deleteImage(result.afterImage.public_id);
    } catch (cloudinaryError) {
      console.error('Error deleting images from Cloudinary:', cloudinaryError);
      // Continue with deletion even if Cloudinary deletion fails
    }

    // Delete from database
    await Results.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Result deleted successfully'
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

