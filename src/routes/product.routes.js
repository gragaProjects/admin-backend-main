const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const auth = require('../middlewares/auth');
const { body } = require('express-validator');
const validate = require('../middlewares/validate');

// Validation schemas
const createProductValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('discountPrice').optional().isFloat({ min: 0 })
    .withMessage('Discount price must be a positive number'),
  body('stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  body('specifications').optional().isArray().withMessage('Specifications must be an array'),
  body('features').optional().isArray().withMessage('Features must be an array'),
  body('images').isArray().withMessage('Images must be an array'),
  body('images.*').isURL().withMessage('Invalid image URL'),
  body('isSubscriptionBased').isBoolean().withMessage('Invalid subscription flag'),
  body('subscriptionDetails').optional().isObject()
    .withMessage('Subscription details must be an object')
];

const updateProductValidation = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('description').optional().trim().notEmpty().withMessage('Description cannot be empty'),
  body('category').optional().trim().notEmpty().withMessage('Category cannot be empty'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('discountPrice').optional().isFloat({ min: 0 })
    .withMessage('Discount price must be a positive number'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  body('specifications').optional().isArray().withMessage('Specifications must be an array'),
  body('features').optional().isArray().withMessage('Features must be an array'),
  body('images').optional().isArray().withMessage('Images must be an array'),
  body('images.*').optional().isURL().withMessage('Invalid image URL'),
  body('isSubscriptionBased').optional().isBoolean().withMessage('Invalid subscription flag'),
  body('subscriptionDetails').optional().isObject()
    .withMessage('Subscription details must be an object'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
];

const updateStockValidation = [
  body('operation').isIn(['add', 'subtract']).withMessage('Invalid operation'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer')
];

// Routes
router.post('/',
  auth.protect(['admin']),
  // createProductValidation,
  validate,
  productController.createProduct
);

router.get('/',
  productController.getAllProducts
);

router.get('/:id',
  productController.getProduct
);

router.put('/:id',
  auth.protect(['admin']),
  updateProductValidation,
  validate,
  productController.updateProduct
);

router.patch('/:id/stock',
  auth.protect(['admin']),
  updateStockValidation,
  validate,
  productController.updateStock
);

module.exports = router; 