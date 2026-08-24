const express = require("express");
const router = express.Router();
const protectRoute = require("../middleware/authMiddleware");
const equipmentReservationController = require("../controllers/equipmentReservationController");

router.get("/", protectRoute, equipmentReservationController.getEquipmentReservations);
router.get("/logs", protectRoute, equipmentReservationController.getAllEquipmentReservationLogs);

router.get("/:role/:userId", protectRoute, equipmentReservationController.getUserEquipmentReservations);
router.get("/logs/:role/:userId", protectRoute, equipmentReservationController.getAllUserEquipmentReservationLogs);

router.post("/", protectRoute, equipmentReservationController.createEquipmentReservation);
router.put("/:id/approved", protectRoute, equipmentReservationController.approveEquipmentReservation);
router.put("/:id/declined", protectRoute, equipmentReservationController.declineEquipmentReservation);
router.put("/:id/cancelled", protectRoute, equipmentReservationController.cancelEquipmentReservation);
router.put("/:id/borrowed", protectRoute, equipmentReservationController.borrowEquipmentReservation);
router.put("/:id/returned", protectRoute, equipmentReservationController.returnEquipmentReservation);

router.get("/:id/queue", protectRoute, equipmentReservationController.getAllEquipmentReservationQueue);

module.exports = router;