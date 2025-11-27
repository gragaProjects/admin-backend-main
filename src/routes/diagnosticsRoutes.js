const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/diagnosticsController");

router.post("/", ctrl.createDiagnostics);
router.get("/", ctrl.getDiagnostics);
router.get("/:id", ctrl.getDiagnosticsById);
router.put("/:id", ctrl.updateDiagnostics);
router.delete("/:id", ctrl.deleteDiagnostics);

module.exports = router;
