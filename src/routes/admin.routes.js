const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const auth = require('../middlewares/auth');

// Protected routes with role-based access
router.get(
  '/',
  auth.protect(), // Any authenticated user
  adminController.getProfile
);

router.put(
  '/',
  auth.protect(), // Any authenticated user
  adminController.updateAdmin
);

//get stats
router.get(`/stats`, auth.protect(), adminController.getStats);

module.exports = router; 