// admin-backend-main/src/models/SubSpecialty.js
const mongoose = require('mongoose');

const SubSpecialtySchema = new mongoose.Schema({
  name: { type: String, required: true },
  specialtyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Specialty', required: true }
}, { timestamps: true });

module.exports = mongoose.model('SubSpecialty', SubSpecialtySchema);
