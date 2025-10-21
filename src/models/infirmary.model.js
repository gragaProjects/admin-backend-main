const mongoose = require('mongoose');
const { Schema } = mongoose;

const InfirmarySchema = new Schema({
  studentId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
  nurseId: { type: Schema.Types.ObjectId, ref: 'Nurse', required: true },
  schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
  date: Date,
  time: String,
  consentFrom: {
    type: String,
    enum: ['parent', 'guardian', 'student', 'doctor', 'nurse']
  },
  complaints: String,
  details: String,
  treatmentGiven: String,
  medicineProvided: {
    inventoryId: { type: Schema.Types.ObjectId, ref: 'Inventory' },
    quantity: Number
  }
}, { timestamps: true });

// Add indexes
InfirmarySchema.index({ studentId: 1 });
InfirmarySchema.index({ date: 1 });

module.exports = mongoose.model('Infirmary', InfirmarySchema); 