const Diagnostics = require("../models/Diagnostics");

exports.createDiagnostics = async (req, res) => {
  try {
    const item = new Diagnostics(req.body);
    await item.save();

    res.json({ status: "success", data: item });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

exports.getDiagnostics = async (req, res) => {
  try {
    const data = await Diagnostics.find().sort({ createdAt: -1 });
    res.json({ status: "success", data });
  } catch (err) {
    res.status(500).json({ status: "error", message: "Failed to fetch diagnostics" });
  }
};

exports.getDiagnosticsById = async (req, res) => {
  try {
    const item = await Diagnostics.findById(req.params.id);
    res.json({ status: "success", data: item });
  } catch (err) {
    res.status(500).json({ status: "error", message: "Failed to fetch diagnostics" });
  }
};

exports.updateDiagnostics = async (req, res) => {
  try {
    const item = await Diagnostics.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ status: "success", data: item });
  } catch (err) {
    res.status(500).json({ status: "error", message: "Failed to update diagnostics" });
  }
};

exports.deleteDiagnostics = async (req, res) => {
  try {
    await Diagnostics.findByIdAndDelete(req.params.id);
    res.json({ status: "success", message: "Deleted" });
  } catch (err) {
    res.status(500).json({ status: "error", message: "Failed to delete diagnostics" });
  }
};
