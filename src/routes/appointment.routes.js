const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointment.controller');
const auth = require('../middlewares/auth');
const { body } = require('express-validator');
const validate = require('../middlewares/validate');

// Validation schemas
const createAppointmentValidation = [
  body('doctorId').notEmpty().withMessage('Doctor ID is required'),
  body('appointmentDateTime').notEmpty().withMessage('Appointment date and time is required')
    .isISO8601().withMessage('Invalid date format'),
  body('appointmentType').isIn(['online', 'offline']).withMessage('Invalid appointment type')
];

const updatePrescriptionValidation = [
  body('diagnosis').notEmpty().withMessage('Diagnosis is required'),
  body('medicines').isArray().withMessage('Medicines must be an array'),
  body('medicines.*.name').notEmpty().withMessage('Medicine name is required'),
  body('medicines.*.dosage').notEmpty().withMessage('Medicine dosage is required'),
  body('medicines.*.frequency').notEmpty().withMessage('Medicine frequency is required')
];

// Routes
router.post('/',
  auth.protect(['admin', 'navigator', 'member']),
  // createAppointmentValidation,
  validate,
  appointmentController.createAppointment
);

router.get('/',
  auth.protect(['admin', 'doctor', 'member', 'navigator']),
  appointmentController.getAllAppointments
);

router.get('/:id',
  auth.protect(['admin', 'doctor', 'member', 'navigator']),
  appointmentController.getAppointment
);

router.put('/:id',
  auth.protect(['admin', 'doctor', 'navigator', 'member']),
  appointmentController.updateAppointment
);

router.put('/:id/status',
  auth.protect(['admin', 'doctor', 'navigator', 'member']),
  body('status').isIn(['confirmed', 'completed', 'cancelled']),
  validate,
  appointmentController.updateAppointmentStatus
);

router.put('/:id/prescription',
  auth.protect(['doctor', 'navigator', 'member', 'admin']),
  updatePrescriptionValidation,
  validate,
  appointmentController.updatePrescription
);

router.delete('/:id',
  auth.protect(['admin', 'doctor', 'navigator', 'member']),
  appointmentController.deleteAppointment
);

// Download appointment PDF
router.get('/:id/pdf',
  auth.protect(['admin', 'doctor', 'navigator', 'member']),
  appointmentController.downloadAppointmentPdf
);

module.exports = router; 