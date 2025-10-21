const express = require('express');
const router = express.Router();
const healthcareProviderController = require('../controllers/healthcare-provider.controller');
const { protect } = require('../middlewares/auth');

// Public routes
router.get('/', healthcareProviderController.getAllProviders);
router.get('/:id', healthcareProviderController.getProvider);

// Protected routes (admin only)
router.post('/', healthcareProviderController.createProvider);
router.put('/:id', healthcareProviderController.updateProvider);
router.delete('/:id', healthcareProviderController.deleteProvider);

module.exports = router; 