const mongoose = require('mongoose');
const { Schema } = mongoose;

const NotificationSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, required: true },
  title: String,
  message: String,
  type: String,
  relatedId: Schema.Types.ObjectId,
  isRead: { type: Boolean, default: false }
}, { timestamps: true });

// Add indexes
NotificationSchema.index({ userId: 1 });
NotificationSchema.index({ isRead: 1 });
NotificationSchema.index({ type: 1 });
NotificationSchema.index({ createdAt: 1 });

module.exports = mongoose.model('Notification', NotificationSchema); 