const express = require('express');
const router = express.Router();
const infirmaryController = require('../controllers/infirmary.controller');

router.post('/', infirmaryController.createVisit);
router.get('/search', infirmaryController.searchVisits);
router.get('/', infirmaryController.getVisits);
router.get('/:id', infirmaryController.getVisitById);
router.put('/:id', infirmaryController.updateVisit);
router.delete('/:id', infirmaryController.deleteVisit);

module.exports = router; 