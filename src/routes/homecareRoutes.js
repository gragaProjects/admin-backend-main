const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/homecareController");

router.post("/", ctrl.createHomecare);
router.get("/", ctrl.getHomecareList);
router.get("/:id", ctrl.getHomecareById);
router.put("/:id", ctrl.updateHomecare);
router.delete("/:id", ctrl.deleteHomecare);

module.exports = router;
