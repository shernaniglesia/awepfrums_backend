const express = require("express");
const router = express.Router();
const protectRoute = require("../middleware/authMiddleware");
const notificationController = require("../controllers/notificationController");

router.get("/:role/:userId", protectRoute, notificationController.getNotifications);
router.post("/read", protectRoute, notificationController.markAsRead);
router.post("/read-all", protectRoute, notificationController.markAllAsRead);
router.post("/clear", protectRoute, notificationController.markAsClear);
router.post("/clear-all", protectRoute, notificationController.markAllAsClear);

module.exports = router;