const express = require('express');
const router = express.Router();
const empanelledDoctorController = require('../controllers/empanelled-doctor.controller');
const auth = require('../middlewares/auth');

// Public routes
router.get('/', auth.protect(['admin', 'navigator']), empanelledDoctorController.getAllDoctors);
router.get('/:id', auth.protect(['admin', 'navigator']), empanelledDoctorController.getDoctor);

// Protected routes (admin only)
router.post('/', auth.protect(['admin', 'navigator']), empanelledDoctorController.createDoctor);
router.put('/:id', auth.protect(['admin', 'navigator']), empanelledDoctorController.updateDoctor);
router.delete('/:id', auth.protect(['admin', 'navigator']), empanelledDoctorController.deleteDoctor);

module.exports = router; 