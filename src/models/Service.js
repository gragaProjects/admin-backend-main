const mongoose = require("mongoose");

const ServiceSchema = new mongoose.Schema({
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Department", required: true },
  name: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model("Service", ServiceSchema);
