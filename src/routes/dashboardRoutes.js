const express = require("express");
const router = express.Router();
const protectRoute = require("../middleware/authMiddleware");
const statsController = require("../controllers/dashboardController");

const verifyAdminRole = (req, res, next) => {
    if (req.user.user_role !== "admin") {
        return res.status(403).json({ success: false, message: "Access Denied. Admin privilege required." });
    }
    next();
};

router.get("/", protectRoute, verifyAdminRole, statsController.getStatsAdmin);
router.get("/instructor/:id", protectRoute, statsController.getStatsInstructor);
router.get("/student/:id", protectRoute, statsController.getStatsStudent);

module.exports = router;