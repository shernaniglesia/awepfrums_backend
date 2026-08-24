const express = require("express");
const router = express.Router();
const protectRoute = require("../middleware/authMiddleware");
const scheduleController = require("../controllers/scheduleController");

router.post("/", protectRoute, scheduleController.createSchedule);
router.post('/addSingleDateSchedule', scheduleController.addSingleDateSchedule);
router.get("/roomsched/:roomId", protectRoute, scheduleController.getScheduleByRoom);
router.get("/:roomId/timetable", protectRoute, scheduleController.getRoomTimetable);
router.get("/allSchedules", protectRoute, scheduleController.getAllSchedules);
router.put("/:id", protectRoute, scheduleController.updateSchedule);
router.delete("/", protectRoute, scheduleController.deleteSchedules);
router.delete("/:id/sched", protectRoute, scheduleController.deleteSpecificSched);

module.exports = router;