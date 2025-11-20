const express = require("express");
const router = express.Router();
const doctorController = require("../controllers/doctorController");
const upload = require("../middlewares/upload");

// Specialties
router.get("/specialties/list", doctorController.getSpecialties);

// Sub-specialties
router.get("/subspecialties/:specialtyId", doctorController.getSubSpecialties);

// Upload photo
router.post("/upload", upload.single("photo"), doctorController.uploadPhoto);

// CRUD
router.post("/", doctorController.createDoctor);
router.get("/", doctorController.getDoctors);
router.get("/:id", doctorController.getDoctorById);
router.put("/:id", doctorController.updateDoctor);
router.delete("/:id", doctorController.deleteDoctor);

module.exports = router;
