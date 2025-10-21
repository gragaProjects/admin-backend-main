const mongoose = require('mongoose');
const { Schema } = mongoose;

const AuthCredentialSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, required: true },
  userType: {
    type: String,
    enum: ['admin', 'navigator', 'nurse', 'doctor', 'empanelled_doctor', 'member'],
    required: true
  },
  memberId: {
    type: String,
    sparse: true,
    validate: {
      validator: function(v) {
        return !v || this.userType === 'member';
      },
      message: 'memberId can only be set for member type users'
    }
  },
  email: String,
  phoneNumber: { type: String, required: true },
  password: String,
  lastOtp: {
    code: String,
    expiresAt: Date
  },
  isActive: { type: Boolean, default: true },
  isFirstLogin: { type: Boolean, default: true },
  temporaryPassword: {
    password: String,
    expiresAt: Date
  },
  passwordChangedAt: Date,
  passwordResetRequired: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('AuthCredential', AuthCredentialSchema); 