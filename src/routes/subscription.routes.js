const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscription.controller');
const auth = require('../middlewares/auth');
const { body } = require('express-validator');
const validate = require('../middlewares/validate');

// Validation schemas
const createSubscriptionValidation = [
  body('productId').isMongoId().withMessage('Invalid product ID'),
  body('planDuration').isInt({ min: 1, max: 12 })
    .withMessage('Plan duration must be between 1 and 12 months'),
  body('autoRenew').isBoolean().withMessage('Invalid auto-renewal setting'),
  body('paymentMethod').isIn(['card', 'upi', 'netbanking'])
    .withMessage('Invalid payment method')
];

const updateSubscriptionStatusValidation = [
  body('status').isIn(['active', 'expired', 'cancelled'])
    .withMessage('Invalid subscription status')
];

// Routes
router.post('/',
  auth.protect(['member']),
  // createSubscriptionValidation,
  validate,
  subscriptionController.createSubscription
);

router.get('/',
  auth.protect(['admin', 'member']),
  subscriptionController.getAllSubscriptions
);

router.get('/:id',
  auth.protect(['admin', 'member']),
  subscriptionController.getSubscription
);

router.patch('/:id/status',
  auth.protect(['admin']),
  updateSubscriptionStatusValidation,
  validate,
  subscriptionController.updateSubscriptionStatus
);

router.patch('/:id/auto-renewal',
  auth.protect(['admin', 'member']),
  subscriptionController.toggleAutoRenewal
);

module.exports = router; 