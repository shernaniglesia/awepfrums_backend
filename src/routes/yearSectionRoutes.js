const express = require("express");
const router = express.Router();
const protectRoute = require("../middleware/authMiddleware");
const yearSectionController = require("../controllers/yearSectionController");

router.get("/", protectRoute, yearSectionController.getYearSection);
router.post("/", protectRoute, yearSectionController.createYearSection);
router.put("/:id", protectRoute, yearSectionController.updateYearSection);

module.exports = router;