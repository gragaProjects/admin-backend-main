const mongoose = require('mongoose');
const { Schema } = mongoose;

const NavigatorSchema = new Schema({
  navigatorId: { 
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
  role: { type: String, default: 'navigator' },
  languagesSpoken: [String],
  introduction: String,
  total_assigned_members: { type: Number, default: 0 },
  rating: { type: Number, default: 0 }
}, { timestamps: true });

// Add pre-save middleware to handle the async navigatorId generation
NavigatorSchema.pre('save', async function(next) {
  if (!this.navigatorId) {
    // Find the last navigatorId
    const lastNav = await this.constructor.findOne({}, { navigatorId: 1 }, { sort: { navigatorId: -1 } });
    
    if (!lastNav || !lastNav.navigatorId) {
      this.navigatorId = 'AHNAV001';  // First navigator or no navigatorId
    } else {
      // Extract the number part after 'AHNAV'
      const currentNum = parseInt(lastNav.navigatorId.replace('AHNAV', ''));
      const nextNum = currentNum + 1;
      
      // For numbers 1-999, pad with zeros to ensure 3 digits
      if (nextNum <= 999) {
        this.navigatorId = `AHNAV${String(nextNum).padStart(3, '0')}`;
      } else {
        // For numbers 1000 and above, no padding needed
        this.navigatorId = `AHNAV${nextNum}`;
      }
    }
  }
  next();
});

// Add indexes
NavigatorSchema.index({ email: 1 });
NavigatorSchema.index({ phone: 1 });

module.exports = mongoose.model('Navigator', NavigatorSchema); 