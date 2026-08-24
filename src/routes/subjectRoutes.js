const express = require("express");
const router = express.Router();
const protectRoute = require("../middleware/authMiddleware");
const subjectController = require("../controllers/subjectController");

router.get("/", protectRoute, subjectController.getSubject);
router.post("/", protectRoute, subjectController.createSubject);
router.put("/:id", protectRoute, subjectController.updateSubject);

module.exports = router;