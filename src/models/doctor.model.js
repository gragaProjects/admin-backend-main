const mongoose = require('mongoose');
const { Schema } = mongoose;
const { timeSlotSchema, addressSchema } = require('./schemas/common');
const mongoosePaginate = require('mongoose-paginate-v2');

const DoctorSchema = new Schema({
  doctorId: { 
    type: String, 
    unique: true 
  },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  profilePic: String,
  digitalSignature: String,
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  specializations: [String],
  qualification: [String],
  medicalCouncilRegistrationNumber: { type: String, required: true },
  experienceYears: Number,
  languagesSpoken: [String],
  serviceTypes: [{
    type: String,
    enum: ['online', 'offline']
  }],
  introduction: String,
  onlineConsultationTimeSlots: [timeSlotSchema],
  offlineConsultationTimeSlots: [timeSlotSchema],
  offlineAddress: addressSchema,
  areas: [{
    pincode: String,
    region: String
  }],
  navigatorAssigned: { type: Boolean, default: false },
  navigatorId: { type: Schema.Types.ObjectId, ref: 'Navigator' },
  role: { type: String, default: 'doctor' },
  total_assigned_members: { type: Number, default: 0 },
  rating: { type: Number, default: 0 }
}, { timestamps: true });

// Add pre-save middleware to handle the async doctorId generation
DoctorSchema.pre('save', async function(next) {
  if (!this.doctorId) {
    // Find the last doctorId
    const lastDoc = await this.constructor.findOne({}, { doctorId: 1 }, { sort: { doctorId: -1 } });
    
    if (!lastDoc || !lastDoc.doctorId) {
      this.doctorId = 'AHDOC001';  // First doctor or no doctorId
    } else {
      // Extract the number part after 'AHDOC'
      const currentNum = parseInt(lastDoc.doctorId.replace('AHDOC', ''));
      const nextNum = currentNum + 1;
      
      // For numbers 1-999, pad with zeros to ensure 3 digits
      if (nextNum <= 999) {
        this.doctorId = `AHDOC${String(nextNum).padStart(3, '0')}`;
      } else {
        // For numbers 1000 and above, no padding needed
        this.doctorId = `AHDOC${nextNum}`;
      }
    }
  }
  next();
});

// Apply the pagination plugin to the schema BEFORE creating the model
DoctorSchema.plugin(mongoosePaginate);
// Add indexes
DoctorSchema.index({ email: 1 });
DoctorSchema.index({ phone: 1 });
DoctorSchema.index({ medicalCouncilRegistrationNumber: 1 });

module.exports = mongoose.model('Doctor', DoctorSchema); 