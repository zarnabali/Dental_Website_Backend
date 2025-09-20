const express = require('express');
const { body, validationResult } = require('express-validator');
const Partner = require('../models/Partner');
const auth = require('../middleware/auth');
const { uploadSingleImage, handleImageUpload, handleUploadError } = require('../middleware/uploadImage');
const { deleteImage } = require('../config/cloudinary');

const router = express.Router();

/**
 * @swagger
 * /api/partners:
 *   get:
 *     summary: Get all partners
 *     tags: [Partners]
 *     responses:
 *       200:
 *         description: Partners retrieved successfully
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
 *                     $ref: '#/components/schemas/Partner'
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
  try {
    const partners = await Partner.find({ isActive: true }).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: partners.length,
      data: partners
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
 * /api/partners/{id}:
 *   get:
 *     summary: Get single partner by ID
 *     tags: [Partners]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Partner ID
 *     responses:
 *       200:
 *         description: Partner retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Partner'
 *       404:
 *         description: Partner not found
 *       500:
 *         description: Server error
 */
router.get('/:id', async (req, res) => {
  try {
    const partner = await Partner.findById(req.params.id);
    
    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'Partner not found'
      });
    }
    
    res.json({
      success: true,
      data: partner
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
 * /api/partners:
 *   post:
 *     summary: Create new partner
 *     tags: [Partners]
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
 *               - partnerName
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Partner logo image
 *               partnerName:
 *                 type: string
 *                 maxLength: 100
 *                 example: "Dental Equipment Co."
 *     responses:
 *       201:
 *         description: Partner created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Partner'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/', auth, uploadSingleImage, handleUploadError, handleImageUpload, [
  body('partnerName').trim().isLength({ min: 1, max: 100 }).withMessage('Partner name must be between 1 and 100 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { partnerName } = req.body;

    const partner = await Partner.create({
      image: {
        public_id: req.cloudinaryData.public_id,
        url: req.cloudinaryData.url
      },
      partnerName
    });

    res.status(201).json({
      success: true,
      data: partner
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
 * /api/partners/{id}:
 *   put:
 *     summary: Update partner
 *     tags: [Partners]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Partner ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               partnerName:
 *                 type: string
 *                 maxLength: 100
 *                 example: "Updated Partner Name"
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Partner updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Partner'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Partner not found
 *       500:
 *         description: Server error
 */
router.put('/:id', auth, [
  body('partnerName').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Partner name must be between 1 and 100 characters'),
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

    const partner = await Partner.findById(req.params.id);
    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'Partner not found'
      });
    }

    const updatedPartner = await Partner.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: updatedPartner
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
 * /api/partners/{id}:
 *   delete:
 *     summary: Delete partner
 *     tags: [Partners]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Partner ID
 *     responses:
 *       200:
 *         description: Partner deleted successfully
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
 *                   example: "Partner deleted successfully"
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Partner not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const partner = await Partner.findById(req.params.id);
    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'Partner not found'
      });
    }

    // Delete image from Cloudinary
    if (partner.image && partner.image.public_id) {
      await deleteImage(partner.image.public_id);
    }

    await Partner.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Partner deleted successfully'
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
