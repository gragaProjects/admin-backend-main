const mongoose = require('mongoose');
const { Schema } = mongoose;

const MedicalHistorySchema = new Schema({
  memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
  medicalReports: [{
    name: String,
    files: [String]
  }],
  treatingDoctors: [{
    name: String,
    hospitalName: String,
    speciality: String
  }],
  followUps: [{
    date: Date,
    specialistDetails: String,
    remarks: String
  }],
  familyHistory: [{
    condition: String,
    relationship: {
      type: String,
      enum: ['father', 'mother', 'sibling', 'grandparent', 'other']
    }
  }],
  allergies: [{
    medications: String,
    food: String,
    other: String
  }],
  currentMedications: [{
    name: String,
    dosage: String,
    frequency: String
  }],
  surgeries: [{
    procedure: String,
    date: Date,
    surgeonName: String
  }],
  previousMedicalConditions: [{
    condition: String,
    diagnosedAt: Date,
    treatmentReceived: String,
    notes: String,
    status: {
      type: String,
      enum: ['active', 'resolved', 'inremission', 'chronic']
    }
  }],
  immunizations: [{
    vaccine: String,
    date: Date
  }],
  medicalTestResults: [{
    name: String,
    date: Date,
    results: String
  }],
  currentSymptoms: [{
    symptom: String,
    concerns: String
  }],
  lifestyleHabits: {
    smoking: {
      type: String,
      enum: ['never', 'occasional', 'daily']
    },
    alcoholConsumption: {
      type: String,
      enum: ['never', 'occasional', 'daily']
    },
    exercise: {
      type: String,
      enum: ['never', 'occasional', 'daily']
    }
  },
  healthInsurance: [{
    provider: String,
    policyNumber: String,
    expiryDate: Date
  }]
}, { timestamps: true });

// Add indexes
MedicalHistorySchema.index({ memberId: 1 });
MedicalHistorySchema.index({ 'surgeries.date': 1 });
MedicalHistorySchema.index({ 'immunizations.date': 1 });

module.exports = mongoose.model('MedicalHistory', MedicalHistorySchema); 