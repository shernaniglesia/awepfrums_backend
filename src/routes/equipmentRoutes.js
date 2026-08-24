const express = require("express");
const router = express.Router();
const protectRoute = require("../middleware/authMiddleware");
const equipmentController = require("../controllers/equipmentController");

router.get("/", protectRoute, equipmentController.getAllEquipment);
router.post("/", protectRoute, equipmentController.createEquipment);
router.put("/:id", protectRoute, equipmentController.updateEquipment);
router.get("/:id/queue", protectRoute, equipmentController.getAllEquipmentReservationQueue);

module.exports = router;