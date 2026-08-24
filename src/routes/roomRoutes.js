const express = require("express");
const router = express.Router();
const protectRoute = require("../middleware/authMiddleware");
const roomController = require("../controllers/roomController");

router.get("/", protectRoute, roomController.listRooms);
router.post("/", protectRoute, roomController.createRoom);
router.put("/:id", protectRoute, roomController.updateRoom);

module.exports = router;