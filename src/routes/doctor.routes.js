const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctor.controller');
const auth = require('../middlewares/auth');
const { body } = require('express-validator');
const validate = require('../middlewares/validate');

// Validation schemas
const createDoctorValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('phone').matches(/^\+?[\d\s-]+$/).withMessage('Please provide a valid phone number'),
  body('qualification').isArray().withMessage('Qualifications must be an array'),
  body('experienceYears').isInt({ min: 0 }).withMessage('Experience must be a non-negative integer'),
  body('languagesSpoken').isArray().withMessage('Languages must be an array'),

];

const updateDoctorValidation = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().withMessage('Please provide a valid email'),
  body('phone').optional().matches(/^\+?[\d\s-]+$/).withMessage('Please provide a valid phone number'),
 
  body('qualification').optional().isArray().withMessage('Qualifications must be an array'),
  body('experienceYears').optional().isInt({ min: 0 }).withMessage('Experience must be a non-negative integer'),
  body('languagesSpoken').optional().isArray().withMessage('Languages must be an array'),

  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
];

// Protected routes with role-based access
router.get(
  '/',
  auth.protect(['admin', 'member', 'navigator', 'doctor']), // Admins and members can view doctors
  doctorController.getAllDoctors
);

//stats api
router.get('/stats',
  auth.protect(['admin', 'doctor']),
  doctorController.getDoctorStats
);

router.get(
  '/:id',
  auth.protect(['admin', 'member', 'doctor', 'navigator']), // Admins, members, and the doctor themselves
  // auth.isResourceOwner('id'), // Doctor can only view their own profile
  doctorController.getDoctor
);

router.post('/',
  auth.protect(['admin']),
  createDoctorValidation,
  validate,
  doctorController.createDoctor
);

router.put(
  '/:id',
  auth.protect(['admin', 'doctor', 'navigator']),
  updateDoctorValidation,
  validate,
  doctorController.updateDoctor
);

router.delete(
  '/:id',
  auth.protect(['admin']), // Only admin can delete doctors
  doctorController.deleteDoctor
);

// Generate doctor profile PDF
router.get('/:id/profile-pdf',
  auth.protect(['admin', 'doctor', 'navigator']),
  doctorController.generateProfile
);

//assign a navigator to a doctor
router.patch('/assign/navigator',
  doctorController.assignNavigator
);



module.exports = router; 