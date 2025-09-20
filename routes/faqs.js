const express = require('express');
const { body, validationResult } = require('express-validator');
const FAQ = require('../models/FAQ');
const auth = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/faqs:
 *   get:
 *     summary: Get all FAQs
 *     tags: [FAQs]
 *     responses:
 *       200:
 *         description: FAQs retrieved successfully
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
 *                   example: 8
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/FAQ'
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
  try {
    const faqs = await FAQ.find({ isActive: true }).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: faqs.length,
      data: faqs
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
 * /api/faqs/{id}:
 *   get:
 *     summary: Get single FAQ by ID
 *     tags: [FAQs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: FAQ ID
 *     responses:
 *       200:
 *         description: FAQ retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/FAQ'
 *       404:
 *         description: FAQ not found
 *       500:
 *         description: Server error
 */
router.get('/:id', async (req, res) => {
  try {
    const faq = await FAQ.findById(req.params.id);
    
    if (!faq) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found'
      });
    }
    
    res.json({
      success: true,
      data: faq
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
 * /api/faqs:
 *   post:
 *     summary: Create new FAQ
 *     tags: [FAQs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - question
 *               - answer
 *             properties:
 *               question:
 *                 type: string
 *                 maxLength: 500
 *                 example: "What are your office hours?"
 *               answer:
 *                 type: string
 *                 maxLength: 2000
 *                 example: "Our office is open Monday through Friday from 9 AM to 6 PM, and Saturday from 9 AM to 2 PM."
 *     responses:
 *       201:
 *         description: FAQ created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/FAQ'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/', auth, [
  body('question').trim().isLength({ min: 1, max: 500 }).withMessage('Question must be between 1 and 500 characters'),
  body('answer').trim().isLength({ min: 1, max: 2000 }).withMessage('Answer must be between 1 and 2000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { question, answer } = req.body;

    const faq = await FAQ.create({
      question,
      answer
    });

    res.status(201).json({
      success: true,
      data: faq
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
 * /api/faqs/{id}:
 *   put:
 *     summary: Update FAQ
 *     tags: [FAQs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: FAQ ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               question:
 *                 type: string
 *                 maxLength: 500
 *                 example: "Updated question"
 *               answer:
 *                 type: string
 *                 maxLength: 2000
 *                 example: "Updated answer"
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: FAQ updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/FAQ'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: FAQ not found
 *       500:
 *         description: Server error
 */
router.put('/:id', auth, [
  body('question').optional().trim().isLength({ min: 1, max: 500 }).withMessage('Question must be between 1 and 500 characters'),
  body('answer').optional().trim().isLength({ min: 1, max: 2000 }).withMessage('Answer must be between 1 and 2000 characters'),
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

    const faq = await FAQ.findById(req.params.id);
    if (!faq) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found'
      });
    }

    const updatedFAQ = await FAQ.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: updatedFAQ
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
 * /api/faqs/{id}:
 *   delete:
 *     summary: Delete FAQ
 *     tags: [FAQs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: FAQ ID
 *     responses:
 *       200:
 *         description: FAQ deleted successfully
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
 *                   example: "FAQ deleted successfully"
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: FAQ not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const faq = await FAQ.findById(req.params.id);
    if (!faq) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found'
      });
    }

    await FAQ.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'FAQ deleted successfully'
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
