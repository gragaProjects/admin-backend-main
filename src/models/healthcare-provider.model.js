const mongoose = require('mongoose');
const { Schema } = mongoose;
const { addressSchema, timeSlotSchema } = require('./schemas/common');

const HealthcareProviderSchema = new Schema({
  name: { type: String, required: true },
  type: {
    type: String,
    enum: ['hospital', 'clinic', 'diagnostic_center', 'pharmacy', 'nursing_home']
  },
  profilePic: String,
  address: addressSchema,
  contactNumber: String,
  email: String,
  website: String,
  servicesOffered: [String],
  operationHours: [timeSlotSchema]
}, { timestamps: true });

// Add indexes
HealthcareProviderSchema.index({ name: 1 });
HealthcareProviderSchema.index({ type: 1 });
HealthcareProviderSchema.index({ 'address.pinCode': 1 });

module.exports = mongoose.model('HealthcareProvider', HealthcareProviderSchema); 