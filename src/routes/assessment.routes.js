const express = require('express');
const router = express.Router();
const assessmentController = require('../controllers/assessment.controller');
const auth = require('../middlewares/auth');
const { body } = require('express-validator');
const validate = require('../middlewares/validate');

// Validation schemas
const createAssessmentValidation = [
  body('memberId').isMongoId().withMessage('Invalid member ID'),
  body('type').isIn(['physical', 'mental', 'nutrition', 'lifestyle'])
    .withMessage('Invalid assessment type'),
  body('responses').isArray().withMessage('Responses must be an array'),
  body('responses.*.question').notEmpty().withMessage('Question is required'),
  body('responses.*.answer').notEmpty().withMessage('Answer is required'),
  body('summary').notEmpty().withMessage('Summary is required'),
  body('recommendations').isArray().withMessage('Recommendations must be an array'),
  body('riskLevel').isIn(['low', 'medium', 'high'])
    .withMessage('Invalid risk level')
];

const updateAssessmentValidation = [
  body('summary').optional().notEmpty().withMessage('Summary cannot be empty'),
  body('recommendations').optional().isArray()
    .withMessage('Recommendations must be an array'),
  body('riskLevel').optional().isIn(['low', 'medium', 'high'])
    .withMessage('Invalid risk level')
];

// Routes
router.post('/',
  // auth.protect(['doctor', 'nurse']),
  // createAssessmentValidation,
  validate,
  assessmentController.createAssessment
);

router.get('/',
  // auth.protect(['admin', 'doctor', 'nurse']),
  assessmentController.getAllAssessments
);

router.get('/:id',
  // auth.protect(['admin', 'doctor', 'nurse', 'member']),
  assessmentController.getAssessment
);

router.put('/:id',
  // auth.protect(['doctor', 'nurse']),
  // updateAssessmentValidation,
  validate,
  assessmentController.updateAssessment
);

router.get('/member/:memberId',
  // auth.protect(['admin', 'doctor', 'nurse', 'member']),
  assessmentController.getMemberAssessments
);

router.delete('/:id',
  // auth.protect(['admin', 'doctor', 'nurse']),
  assessmentController.deleteAssessment
);

//get assessments pdf report download
router.post('/pdf',
  assessmentController.getAssessmentPdf
);

//bulk upload assessments from csv
router.post('/bulk-upload',
  assessmentController.bulkUploadAssessments
);

module.exports = router; 