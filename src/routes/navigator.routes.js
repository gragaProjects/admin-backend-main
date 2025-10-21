const express = require('express');
const router = express.Router();
const navigatorController = require('../controllers/navigator.controller');
const auth = require('../middlewares/auth');
const { body } = require('express-validator');
const validate = require('../middlewares/validate');

// Validation schemas
const createNavigatorValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('phone').matches(/^\+?[\d\s-]+$/).withMessage('Please provide a valid phone number'),
 
  body('dob').optional().isISO8601().withMessage('Invalid date format'),
  body('gender').isIn(['male', 'female', 'other']).withMessage('Invalid gender'),
  body('languagesSpoken').optional().isArray().withMessage('Languages must be an array'),
  
];

const updateNavigatorValidation = [
  body('email').optional().isEmail().withMessage('Please provide a valid email'),
  body('phone').optional().matches(/^\+?[\d\s-]+$/).withMessage('Please provide a valid phone number'),
 
  body('languagesSpoken').optional().isArray().withMessage('Languages must be an array'),

];

//create a route for getting the navigator stats
router.get('/stats',
  auth.protect(['admin', 'navigator']),
  navigatorController.getNavigatorStats
);

// Routes
router.post('/',
  auth.protect(['admin']),
  createNavigatorValidation,
  validate,
  navigatorController.createNavigator
);

router.get('/',
  auth.protect(['admin', 'doctor']),
  navigatorController.getAllNavigators
);

router.get('/:id',
  auth.protect(['admin', 'navigator', 'doctor']),
  navigatorController.getNavigator
);

router.put('/:id',
  auth.protect(['admin', 'navigator']),
  updateNavigatorValidation,
  validate,
  navigatorController.updateNavigator
);

router.get('/:id/members',
  auth.protect(['admin', 'navigator', 'doctor']),
  navigatorController.getNavigatorMembers
);

//create a route for deleting a navigator
router.delete('/:id',
  auth.protect(['admin']),
  navigatorController.deleteNavigator
);

// Generate navigator profile PDF
router.get('/:id/profile-pdf',
  auth.protect(['admin', 'navigator']),
  navigatorController.generateProfile
);

module.exports = router; 