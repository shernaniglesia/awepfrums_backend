const express = require("express");
const router = express.Router();
const protectRoute = require("../middleware/authMiddleware");
const semesterController = require("../controllers/semesterController");

router.get("/active", protectRoute, semesterController.getActiveSem);
router.get("/", protectRoute, semesterController.listSem);
router.post("/", protectRoute, semesterController.createSem);
router.put("/:id/setActive", protectRoute, semesterController.setActiveSem);
router.put("/:id", protectRoute, semesterController.updateSem);

module.exports = router;