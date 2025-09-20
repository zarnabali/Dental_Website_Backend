const express = require('express');
const { body, validationResult } = require('express-validator');
const Team = require('../models/Team');
const auth = require('../middleware/auth');
const { uploadSingleImage, handleImageUpload, handleUploadError } = require('../middleware/uploadImage');
const { deleteImage } = require('../config/cloudinary');

const router = express.Router();

/**
 * @swagger
 * /api/team:
 *   get:
 *     summary: Get all team members
 *     tags: [Team]
 *     responses:
 *       200:
 *         description: Team members retrieved successfully
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
 *                   example: 4
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Team'
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
  try {
    const teamMembers = await Team.find({ isActive: true }).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: teamMembers.length,
      data: teamMembers
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
 * /api/team/{id}:
 *   get:
 *     summary: Get single team member by ID
 *     tags: [Team]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Team Member ID
 *     responses:
 *       200:
 *         description: Team member retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Team'
 *       404:
 *         description: Team member not found
 *       500:
 *         description: Server error
 */
router.get('/:id', async (req, res) => {
  try {
    const teamMember = await Team.findById(req.params.id);
    
    if (!teamMember) {
      return res.status(404).json({
        success: false,
        message: 'Team member not found'
      });
    }
    
    res.json({
      success: true,
      data: teamMember
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
 * /api/team:
 *   post:
 *     summary: Create new team member
 *     tags: [Team]
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
 *               - name
 *               - designation
 *               - speciality
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Team member photo
 *               name:
 *                 type: string
 *                 maxLength: 100
 *                 example: "Dr. John Smith"
 *               designation:
 *                 type: string
 *                 maxLength: 100
 *                 example: "Chief Dental Surgeon"
 *               speciality:
 *                 type: string
 *                 maxLength: 200
 *                 example: "Orthodontics and Cosmetic Dentistry"
 *     responses:
 *       201:
 *         description: Team member created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Team'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/', auth, uploadSingleImage, handleUploadError, handleImageUpload, [
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Name must be between 1 and 100 characters'),
  body('designation').trim().isLength({ min: 1, max: 100 }).withMessage('Designation must be between 1 and 100 characters'),
  body('speciality').trim().isLength({ min: 1, max: 200 }).withMessage('Speciality must be between 1 and 200 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { name, designation, speciality } = req.body;

    const teamMember = await Team.create({
      image: {
        public_id: req.cloudinaryData.public_id,
        url: req.cloudinaryData.url
      },
      name,
      designation,
      speciality
    });

    res.status(201).json({
      success: true,
      data: teamMember
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
 * /api/team/{id}:
 *   put:
 *     summary: Update team member
 *     tags: [Team]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Team Member ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 100
 *                 example: "Dr. John Smith Updated"
 *               designation:
 *                 type: string
 *                 maxLength: 100
 *                 example: "Senior Dental Surgeon"
 *               speciality:
 *                 type: string
 *                 maxLength: 200
 *                 example: "Updated speciality"
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Team member updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Team'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Team member not found
 *       500:
 *         description: Server error
 */
// Accept multipart form with optional image replacement
router.put('/:id', auth,
  uploadSingleImage,
  handleUploadError,
  handleImageUpload,
  [
    body('name').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Name must be between 1 and 100 characters'),
    body('designation').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Designation must be between 1 and 100 characters'),
    body('speciality').optional().trim().isLength({ min: 1, max: 200 }).withMessage('Speciality must be between 1 and 200 characters'),
    body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      // Debug logs
      console.log('Update team request:', {
        params: req.params,
        body: req.body,
        hasFile: !!req.file,
        cloudinaryData: req.cloudinaryData || null,
      });

      const teamMember = await Team.findById(req.params.id);
      if (!teamMember) {
        return res.status(404).json({
          success: false,
          message: 'Team member not found'
        });
      }

      // Build update object from body
      const { name, designation, speciality, isActive } = req.body;
      const update = {
        name: typeof name !== 'undefined' ? name : teamMember.name,
        designation: typeof designation !== 'undefined' ? designation : teamMember.designation,
        speciality: typeof speciality !== 'undefined' ? speciality : teamMember.speciality,
        isActive: typeof isActive !== 'undefined' ? (isActive === true || isActive === 'true') : teamMember.isActive,
        image: teamMember.image,
      };

      // If middleware uploaded a new image, replace existing
      if (req.cloudinaryData?.public_id && req.cloudinaryData?.url) {
        try {
          if (teamMember.image?.public_id) {
            await deleteImage(teamMember.image.public_id);
          }
        } catch (delErr) {
          console.warn('Failed to delete old team image:', delErr?.message);
        }
        update.image = { public_id: req.cloudinaryData.public_id, url: req.cloudinaryData.url };
      }

      const updatedTeamMember = await Team.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });

      res.json({
        success: true,
        data: updatedTeamMember
      });
    } catch (error) {
      console.error('Team update error:', error);
      res.status(500).json({
        success: false,
        message: error?.message || 'Server error'
      });
    }
  });

/**
 * @swagger
 * /api/team/{id}:
 *   delete:
 *     summary: Delete team member
 *     tags: [Team]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Team Member ID
 *     responses:
 *       200:
 *         description: Team member deleted successfully
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
 *                   example: "Team member deleted successfully"
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Team member not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const teamMember = await Team.findById(req.params.id);
    if (!teamMember) {
      return res.status(404).json({
        success: false,
        message: 'Team member not found'
      });
    }

    // Delete image from Cloudinary
    if (teamMember.image && teamMember.image.public_id) {
      await deleteImage(teamMember.image.public_id);
    }

    await Team.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Team member deleted successfully'
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
