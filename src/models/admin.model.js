const mongoose = require('mongoose');
const { Schema } = mongoose;

const AdminSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  dob: Date,
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  profilePic: String,
  role: { type: String, default: 'admin' },
  permissions: [{
    type: String,
    enum: [
      'manage_users',
      'manage_doctors',
      'manage_nurses',
      'manage_navigators',
      'manage_members',
      'manage_schools',
      'manage_products',
      'manage_orders',
      'manage_subscriptions',
      'manage_content',
      'view_reports',
      'manage_settings'
    ]
  }],
  lastLogin: Date,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Add indexes
AdminSchema.index({ email: 1 });
AdminSchema.index({ phone: 1 });

module.exports = mongoose.model('Admin', AdminSchema);
