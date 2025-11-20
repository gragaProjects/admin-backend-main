const Doctor = require("../models/Doctor");
const Specialty = require("../models/Specialty");
const SubSpecialty = require("../models/SubSpecialty");

// =============================
// SPECIALTIES
// =============================
exports.getSpecialties = async (req, res) => {
  try {
    const data = await Specialty.find().sort({ name: 1 });
    res.json({ status: "success", data });
  } catch (e) {
    res.status(500).json({ status: "error", message: "Failed to fetch specialties" });
  }
};

// =============================
// SUB-SPECIALTIES
// =============================
exports.getSubSpecialties = async (req, res) => {
  try {
    const data = await SubSpecialty.find({
      specialtyId: req.params.specialtyId
    }).sort({ name: 1 });

    res.json({ status: "success", data });
  } catch (e) {
    res.status(500).json({ status: "error", message: "Failed to fetch sub-specialties" });
  }
};

// =============================
// UPLOAD DOCTOR PHOTO
// =============================
exports.uploadPhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: "error",
        message: "No file uploaded"
      });
    }

    // req.file.path → cloudinary URL (via multer-cloudinary)
    // req.file.filename → public_id

    res.json({
      status: "success",
      data: {
        url: req.file.path,
        public_id: req.file.filename
      }
    });
  } catch (e) {
    res.status(500).json({
      status: "error",
      message: "Failed to upload image"
    });
  }
};

// =============================
// DOCTOR CREATE
// =============================
exports.createDoctor = async (req, res) => {
  try {
    const doctor = new Doctor(req.body);
    await doctor.save();

    res.json({ status: "success", data: doctor });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      status: "error",
      message: "Failed to create doctor"
    });
  }
};

// =============================
// GET ALL DOCTORS
// =============================
exports.getDoctors = async (req, res) => {
  try {
    // const data = await Doctor.find()
    //   .populate("specialtyId", "name")
    //   .populate("subSpecialtyId", "name")
    //   .sort({ createdAt: -1 });

    const data = await Doctor.find().sort({ createdAt: -1 });

    res.json({ status: "success", data });
  } catch (e) {
    res.status(500).json({
      status: "error",
      message: "Failed to fetch doctors"
    });
  }
};

// =============================
// GET DOCTOR BY ID
// =============================
exports.getDoctorById = async (req, res) => {
  try {
    const data = await Doctor.findById(req.params.id)
      .populate("specialtyId", "name")
      .populate("subSpecialtyId", "name");

    res.json({ status: "success", data });
  } catch (e) {
    res.status(500).json({
      status: "error",
      message: "Failed to fetch doctor"
    });
  }
};

// =============================
// UPDATE DOCTOR
// =============================
exports.updateDoctor = async (req, res) => {
  try {
    const data = await Doctor.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json({ status: "success", data });
  } catch (e) {
    res.status(500).json({
      status: "error",
      message: "Failed to update doctor"
    });
  }
};

// =============================
// DELETE DOCTOR
// =============================
exports.deleteDoctor = async (req, res) => {
  try {
    await Doctor.findByIdAndDelete(req.params.id);
    res.json({ status: "success", message: "Deleted" });
  } catch (e) {
    res.status(500).json({
      status: "error",
      message: "Failed to delete doctor"
    });
  }
};
