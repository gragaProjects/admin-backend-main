const { Notification } = require('../models');
const { logger } = require('../utils/logger');

class NotificationController {
  /**
   * Get user notifications
   */
  async getUserNotifications(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        read,
        type,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const query = { userId: req.user._id };

      // Filter by read status
      if (read !== undefined) {
        query.read = read === 'true';
      }

      // Filter by type
      if (type) {
        query.type = type;
      }

      const notifications = await Notification.find(query)
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

      const total = await Notification.countDocuments(query);
      const unreadCount = await Notification.countDocuments({
        userId: req.user._id,
        read: false
      });

      res.json({
        status: 'success',
        data: notifications,
        unreadCount,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit),
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      logger.error('Get notifications error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error fetching notifications'
      });
    }
  }

  /**
   * Mark notifications as read
   */
  async markAsRead(req, res) {
    try {
      const { notificationIds } = req.body;

      if (!notificationIds || !Array.isArray(notificationIds)) {
        return res.status(400).json({
          status: 'error',
          message: 'Please provide an array of notification IDs'
        });
      }

      await Notification.updateMany(
        {
          _id: { $in: notificationIds },
          userId: req.user._id
        },
        { read: true }
      );

      const unreadCount = await Notification.countDocuments({
        userId: req.user._id,
        read: false
      });

      res.json({
        status: 'success',
        message: 'Notifications marked as read',
        unreadCount
      });
    } catch (error) {
      logger.error('Mark notifications as read error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error marking notifications as read'
      });
    }
  }

  /**
   * Delete notifications
   */
  async deleteNotifications(req, res) {
    try {
      const { notificationIds } = req.body;

      if (!notificationIds || !Array.isArray(notificationIds)) {
        return res.status(400).json({
          status: 'error',
          message: 'Please provide an array of notification IDs'
        });
      }

      await Notification.deleteMany({
        _id: { $in: notificationIds },
        userId: req.user._id
      });

      res.json({
        status: 'success',
        message: 'Notifications deleted successfully'
      });
    } catch (error) {
      logger.error('Delete notifications error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error deleting notifications'
      });
    }
  }

  /**
   * Clear all notifications
   */
  async clearAllNotifications(req, res) {
    try {
      await Notification.deleteMany({ userId: req.user._id });

      res.json({
        status: 'success',
        message: 'All notifications cleared successfully'
      });
    } catch (error) {
      logger.error('Clear notifications error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error clearing notifications'
      });
    }
  }
}

module.exports = new NotificationController(); 