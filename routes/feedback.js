const express = require('express');
const { body, validationResult } = require('express-validator');
const Feedback = require('../models/Feedback');
const auth = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/feedback:
 *   get:
 *     summary: Get all feedback
 *     tags: [Feedback]
 *     responses:
 *       200:
 *         description: Feedback retrieved successfully
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
 *                   example: 15
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Feedback'
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
  try {
    const feedback = await Feedback.find({ isActive: true }).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: feedback.length,
      data: feedback
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
 * /api/feedback/{id}:
 *   get:
 *     summary: Get single feedback by ID
 *     tags: [Feedback]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Feedback ID
 *     responses:
 *       200:
 *         description: Feedback retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Feedback'
 *       404:
 *         description: Feedback not found
 *       500:
 *         description: Server error
 */
router.get('/:id', async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);
    
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }
    
    res.json({
      success: true,
      data: feedback
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
 * /api/feedback:
 *   post:
 *     summary: Create new feedback
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - rating
 *               - title
 *               - description
 *             properties:
 *               username:
 *                 type: string
 *                 maxLength: 100
 *                 example: "John Doe"
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 5
 *               title:
 *                 type: string
 *                 maxLength: 200
 *                 example: "Excellent Service!"
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *                 example: "The dental care was outstanding. Highly recommended!"
 *               status:
 *                 type: string
 *                 enum: [enable, disable]
 *                 example: "enable"
 *     responses:
 *       201:
 *         description: Feedback created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Feedback'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/', auth, [
  body('username').trim().isLength({ min: 1, max: 100 }).withMessage('Username must be between 1 and 100 characters'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be an integer between 1 and 5'),
  body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title must be between 1 and 200 characters'),
  body('description').trim().isLength({ min: 1, max: 1000 }).withMessage('Description must be between 1 and 1000 characters'),
  body('status').optional().isIn(['enable', 'disable']).withMessage('Status must be either enable or disable')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { username, rating, title, description, status } = req.body;

    const feedback = await Feedback.create({
      username,
      rating,
      title,
      description,
      status: status || 'enable'
    });

    res.status(201).json({
      success: true,
      data: feedback
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
 * /api/feedback/{id}:
 *   put:
 *     summary: Update feedback
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Feedback ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 maxLength: 100
 *                 example: "John Doe Updated"
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 4
 *               title:
 *                 type: string
 *                 maxLength: 200
 *                 example: "Updated Title"
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *                 example: "Updated description"
 *               status:
 *                 type: string
 *                 enum: [enable, disable]
 *                 example: "disable"
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Feedback updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Feedback'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Feedback not found
 *       500:
 *         description: Server error
 */
router.put('/:id', auth, [
  body('username').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Username must be between 1 and 100 characters'),
  body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be an integer between 1 and 5'),
  body('title').optional().trim().isLength({ min: 1, max: 200 }).withMessage('Title must be between 1 and 200 characters'),
  body('description').optional().trim().isLength({ min: 1, max: 1000 }).withMessage('Description must be between 1 and 1000 characters'),
  body('status').optional().isIn(['enable', 'disable']).withMessage('Status must be either enable or disable'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    const updatedFeedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: updatedFeedback
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
 * /api/feedback/{id}:
 *   delete:
 *     summary: Delete feedback
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Feedback ID
 *     responses:
 *       200:
 *         description: Feedback deleted successfully
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
 *                   example: "Feedback deleted successfully"
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Feedback not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    await Feedback.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Feedback deleted successfully'
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
