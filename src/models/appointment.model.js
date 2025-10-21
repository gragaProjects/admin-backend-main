const mongoose = require('mongoose');
const { Schema } = mongoose;
const { addressSchema } = require('./schemas/common');

const AppointmentSchema = new Schema({
  memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
  doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor' },
  navigatorId: { type: Schema.Types.ObjectId, ref: 'Navigator' },
  appointedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  appointmentDateTime: Date,
  status: {
    type: String,
    enum: ['pending', 'ongoing', 'cancelled', 'completed'],
    default: 'pending'
  },
  service: String,
  memberAddress: addressSchema,
  hospitalName: String,
  hospitalAddress: String,
  appointmentType: {
    type: String,
    enum: ['online', 'offline'], 
    default: 'offline'
  },
  additionalInfo: String,
  specialization: String,
  notes: String,
  prescription: {
    chiefComplaints: String,
    allergies: String,
    history: String,
    diagnosis: String,
    medicines: [{
      name: String,
      dosage: String,
      frequency: String,
      duration: String,
      investigations: String,
      treatmentPlan: String
    }],
    additionalInstructions: String
  },
  payment: { type: String, enum: ['pending', 'paid'] },
  pdfUrl: String
}, { timestamps: true });

// Add indexes
AppointmentSchema.index({ memberId: 1 });
AppointmentSchema.index({ doctorId: 1 });
AppointmentSchema.index({ navigatorId: 1 });
AppointmentSchema.index({ appointmentDateTime: 1 });
AppointmentSchema.index({ status: 1 });

module.exports = mongoose.model('Appointment', AppointmentSchema); 