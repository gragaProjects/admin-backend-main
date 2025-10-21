const express = require('express');
const router = express.Router();
const nurseController = require('../controllers/nurse.controller');
const auth = require('../middlewares/auth');
const { body } = require('express-validator');
const validate = require('../middlewares/validate');

// Validation schemas
const createNurseValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('schoolId').isMongoId().withMessage('Invalid school ID'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('phone').matches(/^\+?[\d\s-]+$/).withMessage('Please provide a valid phone number'),
  body('dob').optional().isISO8601().withMessage('Invalid date format'),
  body('gender').isIn(['male', 'female', 'other']).withMessage('Invalid gender'),
  body('languagesSpoken').optional().isArray().withMessage('Languages must be an array')
];

const updateNurseValidation = [
  body('email').optional().isEmail().withMessage('Please provide a valid email'),
  body('phone').optional().matches(/^\+?[\d\s-]+$/).withMessage('Please provide a valid phone number'),
  body('dob').optional().isISO8601().withMessage('Invalid date format'),
  body('gender').optional().isIn(['male', 'female', 'other']).withMessage('Invalid gender'),
  body('languagesSpoken').optional().isArray().withMessage('Languages must be an array')
];

//create a route for getting the nurse stats
router.get('/stats',
  auth.protect(['admin', 'nurse']),
  nurseController.getNurseStats
);

// Routes
router.post('/',
  auth.protect(['admin']),
  createNurseValidation,
  validate,
  nurseController.createNurse
);

router.get('/',
  auth.protect(['admin', 'navigator', 'nurse']),
  nurseController.getAllNurses
);

router.get('/:id',
  auth.protect(['admin', 'navigator', 'nurse']),
  nurseController.getNurse
);

router.put('/:id',
  auth.protect(['admin', 'nurse']),
  updateNurseValidation,
  validate,
  nurseController.updateNurse
);

router.get('/:id/members',
  auth.protect(['admin', 'nurse']),
  nurseController.getNurseMembers
);

router.patch('/assign-navigator',
  auth.protect(['admin', 'nurse']),
  nurseController.assignNavigator
);

router.delete('/:id',
  auth.protect(['admin']),
  nurseController.deleteNurse
);

// Generate nurse profile PDF
router.get('/:id/profile-pdf',
  auth.protect(['admin', 'nurse']),
  nurseController.generateProfile
);

module.exports = router; 