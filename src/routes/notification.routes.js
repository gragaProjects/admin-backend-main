const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const auth = require('../middlewares/auth');
const { body } = require('express-validator');
const validate = require('../middlewares/validate');

// Validation schemas
const markAsReadValidation = [
  body('notificationIds')
    .isArray()
    .withMessage('Notification IDs must be an array')
    .notEmpty()
    .withMessage('Notification IDs array cannot be empty'),
  body('notificationIds.*')
    .isMongoId()
    .withMessage('Invalid notification ID format')
];

const deleteNotificationsValidation = [
  body('notificationIds')
    .isArray()
    .withMessage('Notification IDs must be an array')
    .notEmpty()
    .withMessage('Notification IDs array cannot be empty'),
  body('notificationIds.*')
    .isMongoId()
    .withMessage('Invalid notification ID format')
];

// Routes
router.get('/',
  auth.protect(),
  notificationController.getUserNotifications
);

router.put('/mark-read',
  auth.protect(),
  markAsReadValidation,
  validate,
  notificationController.markAsRead
);

router.delete('/',
  auth.protect(),
  deleteNotificationsValidation,
  validate,
  notificationController.deleteNotifications
);

router.delete('/clear-all',
  auth.protect(),
  notificationController.clearAllNotifications
);

module.exports = router; 