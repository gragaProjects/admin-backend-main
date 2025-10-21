const mongoose = require('mongoose');
const { Schema } = mongoose;

const PackageSchema = new Schema({
  code: {
    type: String,
    unique: true,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  durationInMonths: {
    type: Number,
    required: true,
    min: 0
  },
  durationInDays: {
    type: Number,
    required: true,
    min: 0
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  active: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Add pre-save middleware to handle the async code generation
PackageSchema.pre('save', async function(next) {
  if (!this.code) {
    // Find the last package code
    const lastPackage = await this.constructor.findOne({}, { code: 1 }, { sort: { code: -1 } });
    
    if (!lastPackage || !lastPackage.code) {
      this.code = 'AHPKG000';  // First package or no code
    } else {
      const prefix = lastPackage.code.slice(0, 5);
      const num = parseInt(lastPackage.code.slice(5));
      
      if (num < 999) {
        // If number hasn't reached 999, increment it
        this.code = `${prefix}${String(num + 1).padStart(3, '0')}`;
      } else {
        // If number reached 999, increment the prefix
        const lastChar = prefix.charAt(4);
        const newLastChar = String.fromCharCode(lastChar.charCodeAt(0) + 1);
        this.code = `${prefix.slice(0, 4)}${newLastChar}000`;
      }
    }
  }
  next();
});

// Index already created by unique: true in schema definition

module.exports = mongoose.model('Package', PackageSchema);



 
