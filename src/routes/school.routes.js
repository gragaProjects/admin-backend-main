const express = require('express');
const router = express.Router();
const schoolController = require('../controllers/school.controller');
const auth = require('../middlewares/auth');
const { body } = require('express-validator');
const validate = require('../middlewares/validate');

// Validation schemas
const createSchoolValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('address').trim().notEmpty().withMessage('Address is required'),
  body('city').trim().notEmpty().withMessage('City is required'),
  body('state').trim().notEmpty().withMessage('State is required'),
  body('pincode').matches(/^\d{6}$/).withMessage('Invalid pincode'),
  body('contactPerson').trim().notEmpty().withMessage('Contact person is required'),
  body('contactEmail').isEmail().withMessage('Please provide a valid email'),
  body('contactPhone').matches(/^\+?[\d\s-]+$/).withMessage('Please provide a valid phone number'),
  body('type').isIn(['primary', 'secondary', 'higher_secondary']).withMessage('Invalid school type'),
  body('facilities').optional().isArray().withMessage('Facilities must be an array')
];

const updateSchoolValidation = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('address').optional().trim().notEmpty().withMessage('Address cannot be empty'),
  body('city').optional().trim().notEmpty().withMessage('City cannot be empty'),
  body('state').optional().trim().notEmpty().withMessage('State cannot be empty'),
  body('pincode').optional().matches(/^\d{6}$/).withMessage('Invalid pincode'),
  body('contactPerson').optional().trim().notEmpty().withMessage('Contact person cannot be empty'),
  body('contactEmail').optional().isEmail().withMessage('Please provide a valid email'),
  body('contactPhone').optional().matches(/^\+?[\d\s-]+$/).withMessage('Please provide a valid phone number'),
  body('type').optional().isIn(['primary', 'secondary', 'higher_secondary']).withMessage('Invalid school type'),
  body('facilities').optional().isArray().withMessage('Facilities must be an array'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
];

// Routes
router.post('/',
  auth.protect(['admin']),
  // createSchoolValidation,
  validate,
  schoolController.createSchool
);

router.get('/',
  auth.protect(['admin', 'navigator', 'nurse']),
  schoolController.getAllSchools
);

router.get('/:id',
  auth.protect(['admin', 'navigator', 'nurse']),
  schoolController.getSchool
);

router.put('/:id',
  auth.protect(['admin']),
  // updateSchoolValidation,
  validate,
  schoolController.updateSchool
);

router.get('/:id/staff',
  auth.protect(['admin', 'navigator']),
  schoolController.getSchoolStaff
);

router.delete('/:id',
  auth.protect(['admin']),
  schoolController.deleteSchool
);

module.exports = router; 