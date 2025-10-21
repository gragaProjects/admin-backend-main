const mongoose = require('mongoose');
const { Schema } = mongoose;
const { timeSlotSchema } = require('./schemas/common');

const workplaceSchema = new Schema({
  providerId: { 
    type: Schema.Types.ObjectId, 
    ref: 'HealthcareProvider',
    required: true 
  },
  type: { 
    type: String,
    enum: ['hospital', 'clinic', 'diagnostic_center', 'pharmacy', 'nursing_home'],
    required: true 
  },
  name: { 
    type: String,
    required: true 
  },
  timeSlots: [timeSlotSchema],
  consultationFees: { 
    type: Number,
    required: true 
  }
});

const EmpanelledDoctorSchema = new Schema({
  empanelledDoctorId: { 
    type: String, 
    required: true, 
    unique: true
  },
  profilePic: String,
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  qualification: [String],
  experienceInYrs: Number,
  // medicalCouncilRegistrationNumber: { type: String },
  // languagesSpoken: [String],
  // serviceTypes: [String],
  speciality: String,
  specializedIn: String,
  workplaces: [workplaceSchema],
  average_consultation_fees: {
    type: Number,
    default: 0,
    set: function(v) {
      if (!this.workplaces || this.workplaces.length === 0) return 0;
      const total = this.workplaces.reduce((sum, workplace) => sum + workplace.consultationFees, 0);
      return total / this.workplaces.length;
    }
  },
  role: { type: String, default: 'empanelled_doctor' },
  rating: { type: Number, default: 0 }
}, { timestamps: true });

// Add pre-save middleware to handle the async empanelledDoctorId generation
EmpanelledDoctorSchema.pre('validate', async function(next) {
  try {
    if (!this.empanelledDoctorId) {
      // Find the last empanelledDoctorId
      const lastDoc = await this.constructor.findOne({}, { empanelledDoctorId: 1 }).sort({ empanelledDoctorId: -1 });
      
      if (!lastDoc || !lastDoc.empanelledDoctorId) {
        this.empanelledDoctorId = 'AHEMP001';  // First empanelled doctor
      } else {
        // Extract the number part after 'AHEMP'
        const currentNum = parseInt(lastDoc.empanelledDoctorId.replace('AHEMP', ''));
        const nextNum = currentNum + 1;
        
        // For numbers 1-999, pad with zeros to ensure 3 digits
        if (nextNum <= 999) {
          this.empanelledDoctorId = `AHEMP${String(nextNum).padStart(3, '0')}`;
        } else {
          // For numbers 1000 and above, no padding needed
          this.empanelledDoctorId = `AHEMP${nextNum}`;
        }
      }
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Add indexes
EmpanelledDoctorSchema.index({ email: 1 });
EmpanelledDoctorSchema.index({ phone: 1 });
EmpanelledDoctorSchema.index({ 'workplaces.providerId': 1 });

module.exports = mongoose.model('EmpanelledDoctor', EmpanelledDoctorSchema); 