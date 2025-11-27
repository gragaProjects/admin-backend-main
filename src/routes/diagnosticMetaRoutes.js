const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/diagnosticMetaController");

router.get("/services", ctrl.getDiagnosticServices);
router.get("/cities", ctrl.getDiagnosticCities);

module.exports = router;
