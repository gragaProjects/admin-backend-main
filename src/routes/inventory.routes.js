const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventory.controller');

router.post('/', inventoryController.createItem);
router.get('/', inventoryController.getAllItems);
router.get('/:id', inventoryController.getItemById);
router.put('/:id', inventoryController.updateItem);
router.delete('/:id', inventoryController.deleteItem);

module.exports = router; 