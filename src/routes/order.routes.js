const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const auth = require('../middlewares/auth');
const { body } = require('express-validator');
const validate = require('../middlewares/validate');

// Validation schemas
const createOrderValidation = [
  body('items').isArray({ min: 1 }).withMessage('Order must contain at least one item'),
  body('items.*.productId').isMongoId().withMessage('Invalid product ID'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('shippingAddress').isObject().withMessage('Shipping address is required'),
  body('shippingAddress.street').notEmpty().withMessage('Street is required'),
  body('shippingAddress.city').notEmpty().withMessage('City is required'),
  body('shippingAddress.state').notEmpty().withMessage('State is required'),
  body('shippingAddress.pincode').matches(/^\d{6}$/).withMessage('Invalid pincode'),
  body('paymentMethod').isIn(['cod', 'online']).withMessage('Invalid payment method'),
  body('couponCode').optional().isString().withMessage('Invalid coupon code')
];

const updateOrderStatusValidation = [
  body('status').isIn(['confirmed', 'shipped', 'delivered', 'returned', 'cancelled'])
    .withMessage('Invalid order status')
];

// Routes
router.post('/',
  auth.protect(['member']),
  createOrderValidation,
  validate,
  orderController.createOrder
);

router.get('/',
  auth.protect(['admin', 'member']),
  orderController.getAllOrders
);

router.get('/:id',
  auth.protect(['admin', 'member']),
  orderController.getOrder
);

router.patch('/:id/status',
  auth.protect(['admin']),
  updateOrderStatusValidation,
  validate,
  orderController.updateOrderStatus
);

module.exports = router; 