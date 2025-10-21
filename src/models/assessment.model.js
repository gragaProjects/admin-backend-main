const mongoose = require('mongoose');
const { Schema } = mongoose;

const AssessmentSchema = new Schema({
  studentId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
  schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
  name: String,
  heightInFt: Number,
  heightInCm: Number,
  weightInKg: Number,
  bmi: Number,
  temperatureInCelsius: Number,
  temperatureInFahrenheit: Number,
  pulseRateBpm: Number,
  spo2Percentage: Number,
  bp: String,
  oralHealth: String,
  dentalIssues: String,
  visionLeft: String,
  visionRight: String,
  visionComments: String,
  hearingComments: String,
  additionalComments: String,
  nurseSignature: String,
  doctorSignature: String,
  guardianSignature: String,
  pdfUrl: String
}, { timestamps: true });

// Add indexes
AssessmentSchema.index({ studentId: 1 });
AssessmentSchema.index({ schoolId: 1 });
AssessmentSchema.index({ createdAt: 1 });

module.exports = mongoose.model('Assessment', AssessmentSchema); 