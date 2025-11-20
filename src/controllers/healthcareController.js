const Department = require("../models/Department");
const Service = require("../models/Service");
const SubService = require("../models/SubService");
const Hospital = require("../models/Hospital");

// ========== Departments ==========
exports.getDepartments = async (req, res) => {
  try {
    const data = await Department.find().sort({ name: 1 });
    res.json({ status: "success", data });
  } catch (e) {
    res.status(500).json({ status: "error", message: "Failed to fetch departments" });
  }
};

// ========== Services ==========
exports.getServicesByDepartment = async (req, res) => {
  try {
    const data = await Service.find({ departmentId: req.params.deptId }).sort({ name: 1 });
    res.json({ status: "success", data });
  } catch (e) {
    res.status(500).json({ status: "error", message: "Failed to fetch services" });
  }
};

// ========== SubServices ==========
exports.getSubServicesByService = async (req, res) => {
  try {
    const data = await SubService.find({ serviceId: req.params.serviceId }).sort({ name: 1 });
    res.json({ status: "success", data });
  } catch (e) {
    res.status(500).json({ status: "error", message: "Failed to fetch sub-services" });
  }
};

// ========== Hospital (CRUD) ==========
exports.createHospital = async (req, res) => {
  try {
    const hospital = new Hospital(req.body);
    await hospital.save();
    res.json({ status: "success", data: hospital });
  } catch (e) {
    res.status(500).json({ status: "error", message: "Failed to create hospital" });
  }
};

exports.getHospitals = async (req, res) => {
  try {
    const data = await Hospital.find().sort({ createdAt: -1 });
    res.json({ status: "success", data });
  } catch (e) {
    res.status(500).json({ status: "error", message: "Failed to fetch hospitals" });
  }
};

exports.getHospitalById = async (req, res) => {
  try {
    const data = await Hospital.findById(req.params.id);
    res.json({ status: "success", data });
  } catch (e) {
    res.status(500).json({ status: "error", message: "Failed to fetch hospital" });
  }
};

exports.updateHospital = async (req, res) => {
  try {
    const data = await Hospital.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ status: "success", data });
  } catch (e) {
    res.status(500).json({ status: "error", message: "Failed to update hospital" });
  }
};

exports.deleteHospital = async (req, res) => {
  try {
    await Hospital.findByIdAndDelete(req.params.id);
    res.json({ status: "success", message: "Deleted" });
  } catch (e) {
    res.status(500).json({ status: "error", message: "Failed to delete hospital" });
  }
};
