const express = require('express');
const { body, validationResult } = require('express-validator');
const Service = require('../models/Service');
const auth = require('../middleware/auth');
const { uploadSingleImage, handleImageUpload, handleUploadError } = require('../middleware/uploadImage');
const { uploadMultipleSpecificImages, handleMultipleImageUpload, handleUploadError: handleMultipleUploadError } = require('../middleware/uploadMultipleImages');
const { deleteImage, uploadImage } = require('../config/cloudinary');

const router = express.Router();

// Validate text fields BEFORE any Cloudinary upload to avoid unnecessary uploads
function validateCreateService(req, res, next) {
  try {
    const {
      cardTitle,
      cardDescription,
      blogTitle,
      blogDescription,
      paras,
      pointParas,
      youtubeLinks,
    } = req.body || {};

    if (!cardTitle || !cardDescription || !blogTitle || !blogDescription) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    // No character length limits

    // Parse arrays early; store for downstream handler if desired
    let parsedParas = [];
    let parsedPointParas = [];
    let parsedYoutubeLinks = [];
    if (paras) parsedParas = typeof paras === 'string' ? JSON.parse(paras) : paras;
    if (pointParas) parsedPointParas = typeof pointParas === 'string' ? JSON.parse(pointParas) : pointParas;
    if (youtubeLinks) {
      if (typeof youtubeLinks === 'string') {
        parsedYoutubeLinks = youtubeLinks.startsWith('[')
          ? JSON.parse(youtubeLinks)
          : youtubeLinks.split(',').map((l) => l.trim()).filter(Boolean);
      } else {
        parsedYoutubeLinks = youtubeLinks;
      }
    }

    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)\w[\w-]*/;
    for (const link of parsedYoutubeLinks) {
      if (!youtubeRegex.test(link)) {
        return res.status(400).json({ success: false, message: 'Invalid YouTube URL format' });
      }
    }

    req.parsedData = { parsedParas, parsedPointParas, parsedYoutubeLinks };
    return next();
  } catch (e) {
    return res.status(400).json({ success: false, message: 'Invalid JSON for paras/pointParas/youtubeLinks' });
  }
}

/**
 * @swagger
 * /api/services:
 *   get:
 *     summary: Get all services
 *     tags: [Services]
 *     responses:
 *       200:
 *         description: Services retrieved successfully
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
 *                   example: 6
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Service'
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
  try {
    const services = await Service.find({ isActive: true }).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: services.length,
      data: services
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
 * /api/services/{id}:
 *   get:
 *     summary: Get single service by ID
 *     tags: [Services]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Service ID
 *     responses:
 *       200:
 *         description: Service retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Service'
 *       404:
 *         description: Service not found
 *       500:
 *         description: Server error
 */
router.get('/:id', async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }
    
    res.json({
      success: true,
      data: service
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
 * /api/services:
 *   post:
 *     summary: Create new service
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - cardImage
 *               - heroImage
 *               - cardTitle
 *               - cardDescription
 *               - blogTitle
 *               - blogDescription
 *             properties:
 *               cardImage:
 *                 type: string
 *                 format: binary
 *                 description: Service card image
 *               heroImage:
 *                 type: string
 *                 format: binary
 *                 description: Service blog hero image
 *               cardTitle:
 *                 type: string
 *                 maxLength: 100
 *                 example: "Dental Implants"
 *               cardDescription:
 *                 type: string
 *                 maxLength: 500
 *                 example: "Professional dental implant services"
 *               blogTitle:
 *                 type: string
 *                 maxLength: 200
 *                 example: "Complete Guide to Dental Implants"
 *               blogDescription:
 *                 type: string
 *                 maxLength: 1000
 *                 example: "Everything you need to know about dental implants"
 *               paras:
 *                 type: string
 *                 description: JSON string of paragraphs array
 *                 example: '[{"heading":"What are Dental Implants?","content":"Dental implants are..."}]'
 *               pointParas:
 *                 type: string
 *                 description: JSON string of point paragraphs array
 *                 example: '[{"heading":"Benefits","sentences":["Painless procedure","Long lasting"]}]'
 *               youtubeLinks:
 *                 type: string
 *                 description: JSON string of YouTube links array
 *                 example: '["https://youtube.com/watch?v=abc123","https://youtu.be/def456"]'
 *     responses:
 *       201:
 *         description: Service created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Service'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/', auth, uploadMultipleSpecificImages, validateCreateService, handleMultipleUploadError, handleMultipleImageUpload, async (req, res) => {
  try {
    const { 
      cardTitle, 
      cardDescription, 
      blogTitle, 
      blogDescription, 
      paras, 
      pointParas, 
      youtubeLinks 
    } = req.body;

    // Validate required fields
    if (!cardTitle || !cardDescription || !blogTitle || !blogDescription) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Parse JSON strings
    let parsedParas = [];
    let parsedPointParas = [];
    let parsedYoutubeLinks = [];

    try {
      if (paras) parsedParas = JSON.parse(paras);
      if (pointParas) parsedPointParas = JSON.parse(pointParas);
      
      // Handle YouTube links - can be JSON array or comma-separated string
      if (youtubeLinks) {
        if (typeof youtubeLinks === 'string') {
          if (youtubeLinks.startsWith('[')) {
            // JSON array format
            parsedYoutubeLinks = JSON.parse(youtubeLinks);
          } else {
            // Comma-separated string format
            parsedYoutubeLinks = youtubeLinks.split(',').map(link => link.trim()).filter(link => link);
          }
        } else {
          parsedYoutubeLinks = youtubeLinks;
        }
      }
    } catch (parseError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid JSON format for paras, pointParas, or youtubeLinks'
      });
    }

    // Validate YouTube links
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/;
    for (const link of parsedYoutubeLinks) {
      if (!youtubeRegex.test(link)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid YouTube URL format'
        });
      }
    }

    const service = await Service.create({
      cardInfo: {
        title: cardTitle,
        description: cardDescription,
        image: {
          public_id: req.cloudinaryData.cardImage.public_id,
          url: req.cloudinaryData.cardImage.url
        }
      },
      serviceBlog: {
        heroImage: {
          public_id: req.cloudinaryData.heroImage.public_id,
          url: req.cloudinaryData.heroImage.url
        },
        title: blogTitle,
        description: blogDescription,
        paras: parsedParas,
        pointParas: parsedPointParas,
        youtubeLinks: parsedYoutubeLinks
      }
    });

    res.status(201).json({
      success: true,
      data: service
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
 * /api/services/{id}:
 *   put:
 *     summary: Update service
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Service ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cardInfo:
 *                 type: object
 *                 properties:
 *                   title:
 *                     type: string
 *                     maxLength: 100
 *                   description:
 *                     type: string
 *                     maxLength: 500
 *               serviceBlog:
 *                 type: object
 *                 properties:
 *                   title:
 *                     type: string
 *                     maxLength: 200
 *                   description:
 *                     type: string
 *                     maxLength: 1000
 *                   paras:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         heading:
 *                           type: string
 *                         content:
 *                           type: string
 *                   pointParas:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         heading:
 *                           type: string
 *                         sentences:
 *                           type: array
 *                           items:
 *                             type: string
 *                   youtubeLinks:
 *                     type: array
 *                     items:
 *                       type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Service updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Service'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Service not found
 *       500:
 *         description: Server error
 */
router.put('/:id', auth, async (req, res) => {
  try {
    const existing = await Service.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    const body = req.body || {};
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)\w[\w-]*/;

    const update = {
      cardInfo: {
        title: body.cardInfo?.title ?? existing.cardInfo.title,
        description: body.cardInfo?.description ?? existing.cardInfo.description,
        image: existing.cardInfo.image,
      },
      serviceBlog: {
        title: body.serviceBlog?.title ?? existing.serviceBlog.title,
        description: body.serviceBlog?.description ?? existing.serviceBlog.description,
        paras: body.serviceBlog?.paras ?? existing.serviceBlog.paras,
        pointParas: body.serviceBlog?.pointParas ?? existing.serviceBlog.pointParas,
        youtubeLinks: body.serviceBlog?.youtubeLinks ?? existing.serviceBlog.youtubeLinks,
        heroImage: existing.serviceBlog.heroImage,
      },
      isActive: typeof body.isActive !== 'undefined' ? !!body.isActive : existing.isActive,
    };

    if (Array.isArray(update.serviceBlog.youtubeLinks)) {
      for (const link of update.serviceBlog.youtubeLinks) {
        if (!youtubeRegex.test(link)) {
          return res.status(400).json({ success: false, message: 'Invalid YouTube URL format' });
        }
      }
    }

    const updated = await Service.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    return res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Service update error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * @swagger
 * /api/services/{id}:
 *   delete:
 *     summary: Delete service
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Service ID
 *     responses:
 *       200:
 *         description: Service deleted successfully
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
 *                   example: "Service deleted successfully"
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Service not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Delete images from Cloudinary
    if (service.cardInfo.image && service.cardInfo.image.public_id) {
      await deleteImage(service.cardInfo.image.public_id);
    }
    if (service.serviceBlog.heroImage && service.serviceBlog.heroImage.public_id) {
      await deleteImage(service.serviceBlog.heroImage.public_id);
    }

    await Service.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Service deleted successfully'
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
