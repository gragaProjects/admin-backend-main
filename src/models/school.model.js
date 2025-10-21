const mongoose = require('mongoose');
const { Schema } = mongoose;
const { addressSchema } = require('./schemas/common');

const SchoolSchema = new Schema({
  schoolId: { 
    type: String, 
    unique: true 
  },
  name: { type: String, required: true },
  logo: { type: String },
  description: String,
  address: addressSchema,
  contactNumber: String,
  email: String,
  website: String,
  grades: [{
    class: { type: String, enum: ['Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'] },
    section: [{
      name: String,
      studentsCount: Number
    }]
  }],
  principal: {
    name: String,
    email: String,
    phone: String
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Add pre-save middleware to handle the async schoolId generation
SchoolSchema.pre('save', async function(next) {
  if (!this.schoolId) {
    // Find the last schoolId
    const lastSchool = await this.constructor.findOne({}, { schoolId: 1 }, { sort: { schoolId: -1 } });
    
    if (!lastSchool || !lastSchool.schoolId) {
      this.schoolId = 'AHSCH001';  // First school or no schoolId
    } else {
      // Extract the number part after 'AHSCH'
      const currentNum = parseInt(lastSchool.schoolId.replace('AHSCH', ''));
      const nextNum = currentNum + 1;
      
      // For numbers 1-999, pad with zeros to ensure 3 digits
      if (nextNum <= 999) {
        this.schoolId = `AHSCH${String(nextNum).padStart(3, '0')}`;
      } else {
        // For numbers 1000 and above, no padding needed
        this.schoolId = `AHSCH${nextNum}`;
      }
    }
  }
  next();
});

// Add indexes
SchoolSchema.index({ name: 1 });
SchoolSchema.index({ 'address.pinCode': 1 });
SchoolSchema.index({ isActive: 1 });

module.exports = mongoose.model('School', SchoolSchema); 