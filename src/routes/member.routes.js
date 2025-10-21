const express = require('express');
const router = express.Router();
const memberController = require('../controllers/member.controller');
const subscriptionController = require('../controllers/subscription.controller');
const auth = require('../middlewares/auth');
const { body } = require('express-validator');
const validate = require('../middlewares/validate');
const multer = require('multer');
const Member = require('../models/member.model');

// Validation schemas
const createMemberValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('phone').matches(/^\+?[\d\s-]+$/).withMessage('Please provide a valid phone number'),
  body('dob').optional().isISO8601().withMessage('Invalid date format'),
  body('gender').isIn(['male', 'female', 'other']).withMessage('Invalid gender'),
  body('isStudent').optional().isBoolean().withMessage('Invalid student status'),
  body('schoolId').optional().isMongoId().withMessage('Invalid school ID')
];

const updateMemberValidation = [
  body('email').optional().isEmail().withMessage('Please provide a valid email'),
  body('phone').optional().matches(/^\+?[\d\s-]+$/).withMessage('Please provide a valid phone number'),
  body('dob').optional().isISO8601().withMessage('Invalid date format'),
  body('gender').optional().isIn(['male', 'female', 'other']).withMessage('Invalid gender')
];

const assignTeamValidation = [
  body('doctorId').optional().isMongoId().withMessage('Invalid doctor ID'),
  body('nurseId').optional().isMongoId().withMessage('Invalid nurse ID'),
  body('navigatorId').optional().isMongoId().withMessage('Invalid navigator ID')
];

const upload = multer({ 
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    // Accept only CSV files
    if (file.mimetype === 'text/csv') {
      cb(null, true);
    } else {
      cb(new Error('Please upload a CSV file'));
    }
  }
});

// Routes
router.post('/',
  auth.protect(['admin', 'navigator', 'nurse']),
  createMemberValidation,
  validate,
  memberController.createMember
);

router.get('/',
  auth.protect(['admin', 'navigator', 'doctor', 'nurse']),
  memberController.getAllMembers
);

router.get('/:id',
  auth.protect(['admin', 'navigator', 'doctor', 'nurse', 'member']),
  memberController.getMember
);

router.put('/:id',
  auth.protect(['admin', 'navigator', 'member', 'nurse']),
  updateMemberValidation,
  validate,
  memberController.updateMember
);

router.put('/:id/healthcare-team',
  auth.protect(['admin', 'navigator', 'nurse']),
  assignTeamValidation,
  validate,
  memberController.assignHealthcareTeam
);

router.delete('/:id',
  auth.protect(['admin', 'navigator']),
  memberController.deleteMember
);

//assign a navigator to a single or multiple members
router.patch('/assign/navigator',
  auth.protect(['admin', 'navigator']),
  memberController.assignNavigator
);

//assign a doctor to a single or multiple members
router.patch('/assign/doctor',
  auth.protect(['admin', 'navigator']),
  memberController.assignDoctor
);

//assign a nurse to a single or multiple members
router.patch('/assign/nurse',
  auth.protect(['admin', 'navigator']),
  memberController.assignNurse
);

//bulk upload members only
router.post('/bulk-insert', upload.single('file'), memberController.bulkInsertMembers);

//bulk update members only
router.post('/bulk-update', upload.single('file'), memberController.bulkUpdateMembers);

//bulk upload student members only
router.post('/bulk-insert-students/:schoolId', upload.single('file'), memberController.bulkInsertStudentMembers);

//bulk update student members only
router.post('/bulk-update-students', upload.single('file'), memberController.bulkUpdateStudentMembers);

//crud for notes
router.post('/:id/notes',
  auth.protect(['admin', 'navigator', 'nurse', 'doctor']),
  memberController.createNote
);

router.get('/:id/notes',
  auth.protect(['admin', 'navigator', 'nurse', 'doctor']),
  memberController.getNotes
);

router.patch('/:id/notes/:noteId',
  auth.protect(['admin', 'navigator', 'nurse', 'doctor']),
  memberController.updateNote
);

router.delete('/:id/notes/:noteId',
  auth.protect(['admin', 'navigator', 'nurse', 'doctor']),
  memberController.deleteNote
);

router.patch('/:id/membership/renewal', 
  auth.protect(['admin', 'navigator']), 
  memberController.renewMembership
);

//crud for subscription
router.patch('/:id/subscriptions',
  auth.protect(['member', 'admin', 'navigator']),
  subscriptionController.createSubscription
);

router.get('/:id/subscriptions',
  auth.protect(['admin', 'member', 'navigator']),
  subscriptionController.getAllSubscriptions
);

// Generate membership card PDF
router.get('/:id/membership-card',
  auth.protect(['admin', 'navigator', 'member']),
  memberController.generateMembershipCard
);

module.exports = router; 