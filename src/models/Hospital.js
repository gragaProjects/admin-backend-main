const mongoose = require("mongoose");

const HospitalSchema = new mongoose.Schema({
  hospitalName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  website: { type: String },
  address: { type: String, required: true },
  area: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  gstNumber: { type: String },

  department: [{ type: String }],
  departments: [{ type: String }],
  services: [{ type: String }],
  subServices: [{ type: String }],

}, { timestamps: true });

module.exports = mongoose.model("Hospital", HospitalSchema);
