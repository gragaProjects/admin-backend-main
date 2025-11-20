// admin-backend-main/src/models/Specialty.js
const mongoose = require('mongoose');

const SpecialtySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }
}, { timestamps: true });

module.exports = mongoose.model('Specialty', SpecialtySchema);
