const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/physiotherapyController");

router.post("/", ctrl.createPhysiotherapy);
router.get("/", ctrl.getPhysiotherapyList);
router.get("/:id", ctrl.getPhysiotherapyById);
router.put("/:id", ctrl.updatePhysiotherapy);
router.delete("/:id", ctrl.deletePhysiotherapy);

module.exports = router;
