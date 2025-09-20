const express = require('express');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');

const router = express.Router();

// In-memory storage for features (max 2 items)
let features = [
  {
    id: 1,
    featureName: "Innovative Equipment",
    featureDescription: "We use cutting-edge technology for diagnosis and treatment, ensuring a high standard of medical care."
  },
  {
    id: 2,
    featureName: "Personalized Approach",
    featureDescription: "We Develop Customized Treatment And Care Plans, Fully Adapted To The Needs Of Each Patient."
  }
];

let nextId = 3;

/**
 * @swagger
 * /api/features:
 *   get:
 *     summary: Get all features
 *     tags: [Features]
 *     description: Retrieves all features (max 2 items)
 *     responses:
 *       200:
 *         description: Features retrieved successfully
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
 *                   example: 2
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Feature'
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
  try {
    res.json({
      success: true,
      count: features.length,
      data: features
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
 * /api/features:
 *   post:
 *     summary: Add new feature
 *     tags: [Features]
 *     security:
 *       - bearerAuth: []
 *     description: Adds a new feature. Maximum 2 features allowed.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - featureName
 *               - featureDescription
 *             properties:
 *               featureName:
 *                 type: string
 *                 maxLength: 100
 *                 example: "Advanced Technology"
 *               featureDescription:
 *                 type: string
 *                 maxLength: 100
 *                 example: "State-of-the-art equipment for better patient care"
 *     responses:
 *       201:
 *         description: Feature created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Feature'
 *       400:
 *         description: Validation error or maximum features reached
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/', auth, [
  body('featureName').trim().isLength({ min: 1, max: 100 }).withMessage('Feature name must be between 1 and 100 characters'),
  body('featureDescription').trim().isLength({ min: 1, max: 100 }).withMessage('Feature description must be between 1 and 100 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Check if maximum features reached
    if (features.length >= 2) {
      return res.status(400).json({
        success: false,
        message: 'Maximum of 2 features allowed. Please delete an existing feature before adding a new one.'
      });
    }

    const { featureName, featureDescription } = req.body;

    const newFeature = {
      id: nextId++,
      featureName,
      featureDescription
    };

    features.push(newFeature);

    res.status(201).json({
      success: true,
      data: newFeature
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
 * /api/features/{id}:
 *   delete:
 *     summary: Delete feature by ID
 *     tags: [Features]
 *     security:
 *       - bearerAuth: []
 *     description: Deletes a feature by its ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Feature ID
 *     responses:
 *       200:
 *         description: Feature deleted successfully
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
 *                   example: "Feature deleted successfully"
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Feature not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const featureId = parseInt(req.params.id);
    
    const featureIndex = features.findIndex(feature => feature.id === featureId);
    
    if (featureIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Feature not found'
      });
    }

    features.splice(featureIndex, 1);

    res.json({
      success: true,
      message: 'Feature deleted successfully'
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
