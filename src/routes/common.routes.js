const express = require('express');
const router = express.Router();
const commonController = require('../controllers/commonController');
const auth = require('../middlewares/auth');

// Protected routes with role-based access
router.get(
  '/pincode/:pincode',
  auth.protect(['admin', 'navigator', 'nurse', 'doctor', 'member']),
  commonController.getPincodeDetails
);

//Get all settings
router.get('/settings', auth.protect(['admin']), commonController.getSettings);

//Update settings
router.put('/settings/:id', auth.protect(['admin']), commonController.updateSettings);



module.exports = router; 