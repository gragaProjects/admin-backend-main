const express = require('express');
const router = express.Router();
const medicalHistoryController = require('../controllers/medical-history.controller');

// Base CRUD operations
router.post('/:memberId', /**authenticate, */ medicalHistoryController.create);
router.get('/:memberId', /**authenticate, */ medicalHistoryController.getAll);
router.patch('/:memberId', /**authenticate, */ medicalHistoryController.updatebyId);
router.delete('/:memberId', /**authenticate, */ medicalHistoryController.deletebyId);

module.exports = router; 