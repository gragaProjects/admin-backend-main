const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const validate = require('../middlewares/validate');

const router = express.Router();

// Validation schemas
const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('phone').matches(/^\+?[\d\s-]+$/).withMessage('Please provide a valid phone number'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/\d/)
    .withMessage('Password must contain at least one number')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter'),
  body('userType')
    .isIn(['admin', 'navigator', 'nurse', 'doctor', 'empanelled_doctor', 'member'])
    .withMessage('Invalid user type')
];

const loginValidation = [
  body('phoneNumber').optional().matches(/^\+?[\d\s-]+$/).withMessage('Please provide a valid phone number'),
  body('email').optional().isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];

const forgotPasswordValidation = [
  body('phoneNumber').optional().matches(/^\+?[\d\s-]+$/).withMessage('Please provide a valid phone number'),
  body('email').optional().isEmail().withMessage('Please provide a valid email')
];

const resetPasswordValidation = [
  // Token is fetched from Authorization header, no validation needed here
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/\d/)
    .withMessage('Password must contain at least one number')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
];

// Routes

router.post('/login', loginValidation, validate, authController.login);
router.post('/forgot-password', forgotPasswordValidation, validate, authController.forgotPassword);
router.post('/reset-password', resetPasswordValidation, validate, authController.resetPassword);
router.post('/logout', authController.logout);





router.post('/send-otp', forgotPasswordValidation, validate, authController.sendOTP);
router.post('/verify-otp', authController.verifyOTP);

router.post('/register', registerValidation, validate, authController.register);
router.post('/refresh-token', authController.refreshToken);

module.exports = router; 