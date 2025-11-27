const DiagnosticService = require("../models/DiagnosticService");
const DiagnosticCity = require("../models/DiagnosticCity");

// SERVICES
exports.getDiagnosticServices = async (req, res) => {
  try {
    const data = await DiagnosticService.find().sort({ name: 1 });
    res.json({ status: "success", data });
  } catch (err) {
    res.status(500).json({ status: "error", message: "Failed to fetch services" });
  }
};

// CITIES
exports.getDiagnosticCities = async (req, res) => {
  try {
    const data = await DiagnosticCity.find().sort({ name: 1 });
    res.json({ status: "success", data });
  } catch (err) {
    res.status(500).json({ status: "error", message: "Failed to fetch cities" });
  }
};
