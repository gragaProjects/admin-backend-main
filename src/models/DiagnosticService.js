const mongoose = require("mongoose");

const diagnosticServiceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("DiagnosticService", diagnosticServiceSchema);
