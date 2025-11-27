const Physiotherapy = require("../models/Physiotherapy");

exports.createPhysiotherapy = async (req, res) => {
  try {
    const item = new Physiotherapy(req.body);
    await item.save();
    res.json({ status: "success", data: item });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

exports.getPhysiotherapyList = async (req, res) => {
  try {
    const data = await Physiotherapy.find().sort({ createdAt: -1 });
    res.json({ status: "success", data });
  } catch (err) {
    res.status(500).json({ status: "error", message: "Failed to fetch physiotherapy centers" });
  }
};

exports.getPhysiotherapyById = async (req, res) => {
  try {
    const item = await Physiotherapy.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ status: "error", message: "Physiotherapy not found" });
    }
    res.json({ status: "success", data: item });
  } catch (err) {
    res.status(500).json({ status: "error", message: "Failed to fetch physiotherapy" });
  }
};

exports.updatePhysiotherapy = async (req, res) => {
  try {
    const item = await Physiotherapy.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!item) {
      return res.status(404).json({ status: "error", message: "Physiotherapy not found" });
    }
    res.json({ status: "success", data: item });
  } catch (err) {
    res.status(500).json({ status: "error", message: "Failed to update physiotherapy" });
  }
};

exports.deletePhysiotherapy = async (req, res) => {
  try {
    const item = await Physiotherapy.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ status: "error", message: "Physiotherapy not found" });
    }
    res.json({ status: "success", message: "Deleted" });
  } catch (err) {
    res.status(500).json({ status: "error", message: "Failed to delete physiotherapy" });
  }
};
