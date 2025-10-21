const express = require('express');
const router = express.Router();
const packageController = require('../controllers/package.controller');
const auth = require('../middlewares/auth');
const { body } = require('express-validator');
const validate = require('../middlewares/validate');

router.post('/', auth.protect(['admin']), packageController.createPackage);
router.get('/', auth.protect(['admin']), packageController.getPackages);
router.get('/:id', auth.protect(['admin']), packageController.getPackageById);
router.put('/:id', auth.protect(['admin']), packageController.updatePackage);
router.delete('/:id', auth.protect(['admin']), packageController.deletePackage);

module.exports = router;