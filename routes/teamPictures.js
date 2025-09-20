const express = require('express');
const { body, validationResult } = require('express-validator');
const TeamPicture = require('../models/TeamPicture');
const auth = require('../middleware/auth');
const { uploadSingleImage, handleImageUpload, handleUploadError } = require('../middleware/uploadImage');
const { deleteImage } = require('../config/cloudinary');

const router = express.Router();

/**
 * @swagger
 * /api/team-pictures:
 *   get:
 *     summary: Get team picture (single record)
 *     tags: [Team Pictures]
 *     description: Retrieves the single team picture record. Returns 404 if no team picture exists.
 *     responses:
 *       200:
 *         description: Team picture retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/TeamPicture'
 *       404:
 *         description: No team picture found
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
  try {
    const teamPicture = await TeamPicture.findOne({ isActive: true });
    
    if (!teamPicture) {
      return res.status(404).json({
        success: false,
        message: 'No team picture found'
      });
    }
    
    res.json({
      success: true,
      data: teamPicture
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
 * /api/team-pictures:
 *   post:
 *     summary: Create or update team picture (single record)
 *     tags: [Team Pictures]
 *     security:
 *       - bearerAuth: []
 *     description: Creates a new team picture or updates the existing one. Only one team picture can exist at a time.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *               - teamName
 *               - description
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Team picture image file
 *               teamName:
 *                 type: string
 *                 maxLength: 100
 *                 example: "Our Amazing Team"
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 example: "Meet our dedicated team of dental professionals"
 *     responses:
 *       200:
 *         description: Team picture created or updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/TeamPicture'
 *                 message:
 *                   type: string
 *                   example: "Team picture created successfully"
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/', auth, uploadSingleImage, handleUploadError, handleImageUpload, [
  body('teamName').trim().isLength({ min: 1, max: 100 }).withMessage('Team name must be between 1 and 100 characters'),
  body('description').trim().isLength({ min: 1, max: 500 }).withMessage('Description must be between 1 and 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Check if image was uploaded
    if (!req.cloudinaryData) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided. Please include an image file with field name "image".'
      });
    }

    const { teamName, description } = req.body;

    // Check if team picture already exists
    const existingTeamPicture = await TeamPicture.findOne();
    
    let teamPicture;
    let message;

    if (existingTeamPicture) {
      // Update existing team picture
      // Delete old image from Cloudinary
      if (existingTeamPicture.picture?.public_id) {
        try {
          await deleteImage(existingTeamPicture.picture.public_id);
        } catch (delErr) {
          console.warn('Failed to delete old team picture:', delErr?.message);
        }
      }

      // Update the existing record
      teamPicture = await TeamPicture.findByIdAndUpdate(
        existingTeamPicture._id,
        {
          picture: {
            public_id: req.cloudinaryData.public_id,
            url: req.cloudinaryData.url
          },
          teamName,
          description,
          isActive: true
        },
        { new: true, runValidators: true }
      );
      message = 'Team picture updated successfully';
    } else {
      // Create new team picture
      teamPicture = await TeamPicture.create({
        picture: {
          public_id: req.cloudinaryData.public_id,
          url: req.cloudinaryData.url
        },
        teamName,
        description
      });
      message = 'Team picture created successfully';
    }

    res.json({
      success: true,
      data: teamPicture,
      message
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
 * /api/team-pictures:
 *   put:
 *     summary: Update team picture (all three fields)
 *     tags: [Team Pictures]
 *     security:
 *       - bearerAuth: []
 *     description: Updates the existing team picture. All three fields (image, teamName, description) are required.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *               - teamName
 *               - description
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: New team picture image file
 *               teamName:
 *                 type: string
 *                 maxLength: 100
 *                 example: "Updated Team Name"
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 example: "Updated team description"
 *     responses:
 *       200:
 *         description: Team picture updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/TeamPicture'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Team picture not found
 *       500:
 *         description: Server error
 */
router.put('/', auth,
  uploadSingleImage,
  handleUploadError,
  handleImageUpload,
  [
    body('teamName').trim().isLength({ min: 1, max: 100 }).withMessage('Team name must be between 1 and 100 characters'),
    body('description').trim().isLength({ min: 1, max: 500 }).withMessage('Description must be between 1 and 500 characters')
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

      // Check if image was uploaded
      if (!req.cloudinaryData) {
        return res.status(400).json({
          success: false,
          message: 'No image file provided. Please include an image file with field name "image".'
        });
      }

      const teamPicture = await TeamPicture.findOne();
      if (!teamPicture) {
        return res.status(404).json({
          success: false,
          message: 'Team picture not found'
        });
      }

      const { teamName, description } = req.body;

      // Delete old image from Cloudinary
      if (teamPicture.picture?.public_id) {
        try {
          await deleteImage(teamPicture.picture.public_id);
        } catch (delErr) {
          console.warn('Failed to delete old team picture:', delErr?.message);
        }
      }

      // Update all three fields
      const updatedTeamPicture = await TeamPicture.findByIdAndUpdate(
        teamPicture._id,
        {
          picture: {
            public_id: req.cloudinaryData.public_id,
            url: req.cloudinaryData.url
          },
          teamName,
          description,
          isActive: true
        },
        { new: true, runValidators: true }
      );

      res.json({
        success: true,
        data: updatedTeamPicture,
        message: 'Team picture updated successfully'
      });
    } catch (error) {
      console.error('Team picture update error:', error);
      res.status(500).json({
        success: false,
        message: error?.message || 'Server error'
      });
    }
  });

/**
 * @swagger
 * /api/team-pictures:
 *   delete:
 *     summary: Delete team picture (single record)
 *     tags: [Team Pictures]
 *     security:
 *       - bearerAuth: []
 *     description: Deletes the single team picture record and removes the image from Cloudinary.
 *     responses:
 *       200:
 *         description: Team picture deleted successfully
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
 *                   example: "Team picture deleted successfully"
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Team picture not found
 *       500:
 *         description: Server error
 */
router.delete('/', auth, async (req, res) => {
  try {
    const teamPicture = await TeamPicture.findOne();
    if (!teamPicture) {
      return res.status(404).json({
        success: false,
        message: 'Team picture not found'
      });
    }

    // Delete image from Cloudinary
    if (teamPicture.picture && teamPicture.picture.public_id) {
      await deleteImage(teamPicture.picture.public_id);
    }

    await TeamPicture.findByIdAndDelete(teamPicture._id);

    res.json({
      success: true,
      message: 'Team picture deleted successfully'
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
