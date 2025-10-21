const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blog.controller');
const auth = require('../middlewares/auth');
const { body } = require('express-validator');
const validate = require('../middlewares/validate');

// Validation schemas
const createBlogValidation = [
  body('title').trim().notEmpty().withMessage('Title is required')
    .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
  body('content').trim().notEmpty().withMessage('Content is required'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('coverImage').optional().isURL().withMessage('Invalid cover image URL'),
  body('isPublished').optional().isBoolean().withMessage('Invalid published status')
];

const updateBlogValidation = [
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty')
    .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
  body('content').optional().trim().notEmpty().withMessage('Content cannot be empty'),
  body('category').optional().trim().notEmpty().withMessage('Category cannot be empty'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('coverImage').optional().isURL().withMessage('Invalid cover image URL'),
  body('isPublished').optional().isBoolean().withMessage('Invalid published status')
];

// Routes
router.post('/',
  auth.protect(['admin', 'doctor']),
  createBlogValidation,
  validate,
  blogController.createBlog
);

router.get('/',
  blogController.getAllBlogs
);

router.get('/:slug',
  blogController.getBlog
);

router.put('/:slug',
  auth.protect(['admin', 'doctor']),
  updateBlogValidation,
  validate,
  blogController.updateBlog
);

router.delete('/:slug',
  auth.protect(['admin', 'doctor']),
  blogController.deleteBlog
);

module.exports = router; 