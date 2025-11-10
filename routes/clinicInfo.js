const express = require('express');
const { body, validationResult } = require('express-validator');
const ClinicInfo = require('../models/ClinicInfo');
const auth = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/clinic-info:
 *   get:
 *     summary: Get clinic information
 *     tags: [Clinic Info]
 *     responses:
 *       200:
 *         description: Clinic information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ClinicInfo'
 *       404:
 *         description: Clinic information not found
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
  try {
    const clinicInfo = await ClinicInfo.findOne({ isActive: true });
    
    if (!clinicInfo) {
      return res.status(404).json({
        success: false,
        message: 'Clinic information not found'
      });
    }
    
    res.json({
      success: true,
      data: clinicInfo
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
 * /api/clinic-info:
 *   post:
 *     summary: Create new clinic information (only one allowed)
 *     tags: [Clinic Info]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - noOfExperience
 *               - noOfPatients
 *               - phoneNumber
 *               - location1
 *               - location2
 *               - email
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 200
 *                 example: "Dr. Samiullah Dental Clinic"
 *               noOfExperience:
 *                 type: integer
 *                 minimum: 0
 *                 example: 15
 *               noOfPatients:
 *                 type: integer
 *                 minimum: 0
 *                 example: 5000
 *               phoneNumber:
 *                 type: string
 *                 example: "+1234567890"
 *               location1:
 *                 type: object
 *                 required:
 *                   - url
 *                   - description
 *                 properties:
 *                   url:
 *                     type: string
 *                     example: "https://maps.google.com/..."
 *                   description:
 *                     type: string
 *                     maxLength: 500
 *                     example: "123 Main Street, City, State 12345"
 *               location2:
 *                 type: object
 *                 required:
 *                   - url
 *                   - description
 *                 properties:
 *                   url:
 *                     type: string
 *                     example: "https://maps.google.com/..."
 *                   description:
 *                     type: string
 *                     maxLength: 500
 *                     example: "456 Second Street, City, State 12345"
 *               socialLinks:
 *                 type: object
 *                 properties:
 *                   facebook:
 *                     type: string
 *                     example: "https://facebook.com/dentalclinic"
 *                   instagram:
 *                     type: string
 *                     example: "https://instagram.com/dentalclinic"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "info@dentalclinic.com"
 *               timings:
 *                 type: string
 *                 example: "Monday - Friday: 9:00 AM - 6:00 PM"
 *     responses:
 *       201:
 *         description: Clinic information created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ClinicInfo'
 *                 message:
 *                   type: string
 *                   example: "Clinic information created successfully"
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
 *                   example: "Clinic information limit exceeded. Only one clinic information is allowed."
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/', auth, [
  body('name').trim().isLength({ min: 1, max: 200 }).withMessage('Name must be between 1 and 200 characters'),
  body('noOfExperience').isInt({ min: 0 }).withMessage('Number of experience must be a non-negative integer'),
  body('noOfPatients').isInt({ min: 0 }).withMessage('Number of patients must be a non-negative integer'),
  body('phoneNumber').matches(/^[\+]?[1-9][\d]{0,15}$/).withMessage('Phone number must be a valid international format'),
  body('location1.url').isURL().withMessage('Location 1 URL must be a valid URL'),
  body('location1.description').trim().isLength({ min: 1, max: 500 }).withMessage('Location 1 description must be between 1 and 500 characters'),
  body('location2.url').isURL().withMessage('Location 2 URL must be a valid URL'),
  body('location2.description').trim().isLength({ min: 1, max: 500 }).withMessage('Location 2 description must be between 1 and 500 characters'),
  body('socialLinks.facebook').optional().isURL().withMessage('Facebook link must be a valid URL'),
  body('socialLinks.instagram').optional().isURL().withMessage('Instagram link must be a valid URL'),
  body('email').isEmail().withMessage('Email must be a valid email address'),
  body('timings').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Check if clinic info already exists BEFORE creating
    const existingClinicInfo = await ClinicInfo.findOne({ isActive: true });
    
    if (existingClinicInfo) {
      return res.status(400).json({
        success: false,
        message: 'Clinic information limit exceeded. Only one clinic information is allowed. Please delete the existing one first or use the update endpoint.'
      });
    }

    // Create new clinic info
    const clinicInfo = await ClinicInfo.create(req.body);

    return res.status(201).json({
      success: true,
      data: clinicInfo,
      message: 'Clinic information created successfully'
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
 * /api/clinic-info/update:
 *   put:
 *     summary: Update existing clinic information
 *     tags: [Clinic Info]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 200
 *                 example: "Updated Clinic Name"
 *               noOfExperience:
 *                 type: integer
 *                 minimum: 0
 *                 example: 20
 *               noOfPatients:
 *                 type: integer
 *                 minimum: 0
 *                 example: 6000
 *               phoneNumber:
 *                 type: string
 *                 example: "+1234567890"
 *               location1:
 *                 type: object
 *                 properties:
 *                   url:
 *                     type: string
 *                     example: "https://maps.google.com/..."
 *                   description:
 *                     type: string
 *                     maxLength: 500
 *                     example: "Updated address 1"
 *               location2:
 *                 type: object
 *                 properties:
 *                   url:
 *                     type: string
 *                     example: "https://maps.google.com/..."
 *                   description:
 *                     type: string
 *                     maxLength: 500
 *                     example: "Updated address 2"
 *               socialLinks:
 *                 type: object
 *                 properties:
 *                   facebook:
 *                     type: string
 *                     example: "https://facebook.com/updated"
 *                   instagram:
 *                     type: string
 *                     example: "https://instagram.com/updated"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "updated@dentalclinic.com"
 *               timings:
 *                 type: string
 *                 example: "Monday - Friday: 9:00 AM - 6:00 PM"
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Clinic information updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ClinicInfo'
 *                 message:
 *                   type: string
 *                   example: "Clinic information updated successfully"
 *       400:
 *         description: Validation error or no existing clinic info
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.put('/update', auth, [
  body('name').optional().trim().isLength({ min: 1, max: 200 }).withMessage('Name must be between 1 and 200 characters'),
  body('noOfExperience').optional().isInt({ min: 0 }).withMessage('Number of experience must be a non-negative integer'),
  body('noOfPatients').optional().isInt({ min: 0 }).withMessage('Number of patients must be a non-negative integer'),
  body('phoneNumber').optional().matches(/^[\+]?[1-9][\d]{0,15}$/).withMessage('Phone number must be a valid international format'),
  body('location1.url').optional().isURL().withMessage('Location 1 URL must be a valid URL'),
  body('location1.description').optional().trim().isLength({ min: 1, max: 500 }).withMessage('Location 1 description must be between 1 and 500 characters'),
  body('location2.url').optional().isURL().withMessage('Location 2 URL must be a valid URL'),
  body('location2.description').optional().trim().isLength({ min: 1, max: 500 }).withMessage('Location 2 description must be between 1 and 500 characters'),
  body('socialLinks.facebook').optional().isURL().withMessage('Facebook link must be a valid URL'),
  body('socialLinks.instagram').optional().isURL().withMessage('Instagram link must be a valid URL'),
  body('email').optional().isEmail().withMessage('Email must be a valid email address'),
  body('timings').optional().trim(),
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

    // Check if clinic info exists
    const existingClinicInfo = await ClinicInfo.findOne({ isActive: true });
    
    if (!existingClinicInfo) {
      return res.status(400).json({
        success: false,
        message: 'No clinic information found to update. Please create one first.'
      });
    }

    const updatedClinicInfo = await ClinicInfo.findByIdAndUpdate(
      existingClinicInfo._id,
      req.body,
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      data: updatedClinicInfo,
      message: 'Clinic information updated successfully'
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
 * /api/clinic-info:
 *   delete:
 *     summary: Delete clinic information
 *     tags: [Clinic Info]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Clinic information deleted successfully
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
 *                   example: "Clinic information deleted successfully"
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Clinic information not found
 *       500:
 *         description: Server error
 */
router.delete('/', auth, async (req, res) => {
  try {
    const clinicInfo = await ClinicInfo.findOne({ isActive: true });
    if (!clinicInfo) {
      return res.status(404).json({
        success: false,
        message: 'Clinic information not found'
      });
    }

    await ClinicInfo.findByIdAndDelete(clinicInfo._id);

    res.json({
      success: true,
      message: 'Clinic information deleted successfully'
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
