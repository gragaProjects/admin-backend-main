const mongoose = require('mongoose');
const { Schema } = mongoose;

const NurseSchema = new Schema({
  nurseId: { 
    type: String, 
    unique: true 
  },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  dob: Date,
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  profilePic: String,
  navigatorAssigned: { type: Boolean, default: false },
  navigatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Navigator' },
  schoolAssigned: { type: Boolean, default: false },
  schoolId: { type: String, ref: 'School' },
  role: { type: String, default: 'nurse' },
  languagesSpoken: [String],
  introduction: String
}, { timestamps: true });

// Add pre-save middleware to handle the async nurseId generation
NurseSchema.pre('save', async function(next) {
  if (!this.nurseId) {
    // Find the last nurseId
    const lastNurse = await this.constructor.findOne({}, { nurseId: 1 }, { sort: { nurseId: -1 } });
    
    if (!lastNurse || !lastNurse.nurseId) {
      this.nurseId = 'AHNUR001';  // First nurse or no nurseId
    } else {
      // Extract the number part after 'AHNUR'
      const currentNum = parseInt(lastNurse.nurseId.replace('AHNUR', ''));
      const nextNum = currentNum + 1;
      
      // For numbers 1-999, pad with zeros to ensure 3 digits
      if (nextNum <= 999) {
        this.nurseId = `AHNUR${String(nextNum).padStart(3, '0')}`;
      } else {
        // For numbers 1000 and above, no padding needed
        this.nurseId = `AHNUR${nextNum}`;
      }
    }
  }
  next();
});

// Add indexes
NurseSchema.index({ email: 1 });
NurseSchema.index({ phone: 1 });
NurseSchema.index({ schoolId: 1 });

module.exports = mongoose.model('Nurse', NurseSchema); 