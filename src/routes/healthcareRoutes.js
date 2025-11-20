const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/healthcareController");

// Department
router.get("/departments", ctrl.getDepartments);

// Services
router.get("/services/:deptId", ctrl.getServicesByDepartment);

// SubServices
router.get("/subservices/:serviceId", ctrl.getSubServicesByService);

// Hospitals
router.get("/hospitals", ctrl.getHospitals);
router.get("/hospitals/:id", ctrl.getHospitalById);
router.post("/hospitals", ctrl.createHospital);
router.put("/hospitals/:id", ctrl.updateHospital);
router.delete("/hospitals/:id", ctrl.deleteHospital);

module.exports = router;
