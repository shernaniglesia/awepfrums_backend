const express = require("express");
const router = express.Router();
const protectRoute = require("../middleware/authMiddleware");
const roomReservationController = require("../controllers/roomReservationController");

router.get("/", protectRoute, roomReservationController.getAllRoomReservations);
router.get("/logs", protectRoute, roomReservationController.getAllRoomReservationLogs);

router.get("/:instructorId", protectRoute, roomReservationController.getAllUserRoomReservations);
router.get("/logs/:instructorId", protectRoute, roomReservationController.getAllUserRoomReservationLogs);

router.post("/", protectRoute, roomReservationController.createRoomReservation);
router.put("/:id/approved", protectRoute, roomReservationController.approveRoomReservation);
router.put("/:id/declined", protectRoute, roomReservationController.declineRoomReservation);
router.put("/:id/cancelled", protectRoute, roomReservationController.cancelRoomReservation);
router.put("/:id/removed", protectRoute, roomReservationController.removeRoomReservation);

module.exports = router;