const mongoose = require("mongoose");

const diagnosticCitySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("DiagnosticCity", diagnosticCitySchema);
