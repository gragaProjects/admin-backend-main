const Homecare = require("../models/Homecare");

exports.createHomecare = async (req, res) => {
  try {
    const item = new Homecare(req.body);
    await item.save();
    res.json({ status: "success", data: item });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

exports.getHomecareList = async (req, res) => {
  try {
    const data = await Homecare.find().sort({ createdAt: -1 });
    res.json({ status: "success", data });
  } catch (err) {
    res
      .status(500)
      .json({ status: "error", message: "Failed to fetch homecare providers" });
  }
};

exports.getHomecareById = async (req, res) => {
  try {
    const item = await Homecare.findById(req.params.id);
    if (!item) {
      return res
        .status(404)
        .json({ status: "error", message: "Homecare not found" });
    }
    res.json({ status: "success", data: item });
  } catch (err) {
    res
      .status(500)
      .json({ status: "error", message: "Failed to fetch homecare" });
  }
};

exports.updateHomecare = async (req, res) => {
  try {
    const item = await Homecare.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!item) {
      return res
        .status(404)
        .json({ status: "error", message: "Homecare not found" });
    }
    res.json({ status: "success", data: item });
  } catch (err) {
    res
      .status(500)
      .json({ status: "error", message: "Failed to update homecare" });
  }
};

exports.deleteHomecare = async (req, res) => {
  try {
    const item = await Homecare.findByIdAndDelete(req.params.id);
    if (!item) {
      return res
        .status(404)
        .json({ status: "error", message: "Homecare not found" });
    }
    res.json({ status: "success", message: "Deleted" });
  } catch (err) {
    res
      .status(500)
      .json({ status: "error", message: "Failed to delete homecare" });
  }
};
