const express = require('express');
const { body, validationResult } = require('express-validator');
const Blog = require('../models/Blog');
const auth = require('../middleware/auth');
const { uploadSingleImage, handleImageUpload, handleUploadError } = require('../middleware/uploadImage');
const { uploadMultipleSpecificImages, handleMultipleImageUpload, handleUploadError: handleMultipleUploadError } = require('../middleware/uploadMultipleImages');
const { deleteImage, uploadImage } = require('../config/cloudinary');

const router = express.Router();

/**
 * @swagger
 * /api/blogs:
 *   get:
 *     summary: Get all blogs
 *     tags: [Blogs]
 *     responses:
 *       200:
 *         description: Blogs retrieved successfully
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
 *                     $ref: '#/components/schemas/Blog'
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
  try {
    const blogs = await Blog.find({ isActive: true }).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: blogs.length,
      data: blogs
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
 * /api/blogs/{id}:
 *   get:
 *     summary: Get single blog by ID
 *     tags: [Blogs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Blog ID
 *     responses:
 *       200:
 *         description: Blog retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Blog'
 *       404:
 *         description: Blog not found
 *       500:
 *         description: Server error
 */
router.get('/:id', async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }
    
    res.json({
      success: true,
      data: blog
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
 * /api/blogs:
 *   post:
 *     summary: Create new blog
 *     tags: [Blogs]
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
 *                 description: Blog card image
 *               heroImage:
 *                 type: string
 *                 format: binary
 *                 description: Blog hero image
 *               cardTitle:
 *                 type: string
 *                 maxLength: 100
 *                 example: "Dental Care Tips"
 *               cardDescription:
 *                 type: string
 *                 maxLength: 500
 *                 example: "Essential tips for maintaining oral health"
 *               blogTitle:
 *                 type: string
 *                 maxLength: 200
 *                 example: "Complete Guide to Oral Hygiene"
 *               blogDescription:
 *                 type: string
 *                 maxLength: 1000
 *                 example: "Everything you need to know about maintaining good oral health"
 *               paras:
 *                 type: string
 *                 description: JSON string of paragraphs array
 *                 example: '[{"heading":"Brushing Techniques","content":"Proper brushing is essential..."}]'
 *               pointParas:
 *                 type: string
 *                 description: JSON string of point paragraphs array
 *                 example: '[{"heading":"Daily Routine","sentences":["Brush twice daily","Floss regularly"]}]'
 *               youtubeLinks:
 *                 type: string
 *                 description: JSON string of YouTube links array
 *                 example: '["https://youtube.com/watch?v=abc123","https://youtu.be/def456"]'
 *     responses:
 *       201:
 *         description: Blog created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Blog'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/', auth, uploadMultipleSpecificImages, handleMultipleUploadError, handleMultipleImageUpload, async (req, res) => {
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

    const blog = await Blog.create({
      cardInfo: {
        title: cardTitle,
        description: cardDescription,
        image: {
          public_id: req.cloudinaryData.cardImage.public_id,
          url: req.cloudinaryData.cardImage.url
        }
      },
      blogContent: {
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
      data: blog
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
 * /api/blogs/{id}:
 *   put:
 *     summary: Update blog
 *     tags: [Blogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Blog ID
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
 *               blogContent:
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
 *         description: Blog updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Blog'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Blog not found
 *       500:
 *         description: Server error
 */
router.put('/:id', auth, async (req, res) => {
  try {
    const existing = await Blog.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }

    const body = req.body || {};
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)\w[\w-]*/;

    const update = {
      cardInfo: {
        title: body.cardInfo?.title ?? existing.cardInfo.title,
        description: body.cardInfo?.description ?? existing.cardInfo.description,
        image: existing.cardInfo.image,
      },
      blogContent: {
        title: body.blogContent?.title ?? existing.blogContent.title,
        description: body.blogContent?.description ?? existing.blogContent.description,
        paras: body.blogContent?.paras ?? existing.blogContent.paras,
        pointParas: body.blogContent?.pointParas ?? existing.blogContent.pointParas,
        youtubeLinks: body.blogContent?.youtubeLinks ?? existing.blogContent.youtubeLinks,
        heroImage: existing.blogContent.heroImage,
      },
      isActive: typeof body.isActive !== 'undefined' ? !!body.isActive : existing.isActive,
    };

    if (Array.isArray(update.blogContent.youtubeLinks)) {
      for (const link of update.blogContent.youtubeLinks) {
        if (!youtubeRegex.test(link)) {
          return res.status(400).json({ success: false, message: 'Invalid YouTube URL format' });
        }
      }
    }

    const updated = await Blog.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    return res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Blog update error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * @swagger
 * /api/blogs/{id}:
 *   delete:
 *     summary: Delete blog
 *     tags: [Blogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Blog ID
 *     responses:
 *       200:
 *         description: Blog deleted successfully
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
 *                   example: "Blog deleted successfully"
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Blog not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    // Delete images from Cloudinary
    if (blog.cardInfo.image && blog.cardInfo.image.public_id) {
      await deleteImage(blog.cardInfo.image.public_id);
    }
    if (blog.blogContent.heroImage && blog.blogContent.heroImage.public_id) {
      await deleteImage(blog.blogContent.heroImage.public_id);
    }

    await Blog.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Blog deleted successfully'
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
