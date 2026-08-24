const scheduleService = require("../services/scheduleService");

class ScheduleController {
    async createSchedule(req, res) {
        try {
            const { room_id, sem_id, subject_id, year_section_id, schedule_start_time, schedule_end_time, days } = req.body;

            if (!room_id || !sem_id || !subject_id || !year_section_id || !schedule_start_time || !schedule_end_time || !Array.isArray(days) || days.length === 0) {
                return res.status(400).json({ message: "Missing required fields" });
            }

            const result = await scheduleService.createSchedule(req.body);
            return res.status(200).json({ message: "Schedule created successfully", ...result });
        } catch (err) {
            console.error("Error createSchedule Controller:", err);
            if (err.message === "SCHEDULE_OVERLAP") {
                return res.status(400).json({ message: "Conflict: This schedule overlaps with an existing schedule." });
            }
            if (err.message === "INVALID_SEMESTER_ID") return res.status(400).json({ message: "Invalid semester id" });
            if (err.message === "SEMESTER_NOT_ACTIVE") return res.status(400).json({ message: "Semester not active" });
            if (err.message === "SEMESTER_DATES_INVALID") return res.status(400).json({ message: "Semester has invalid start/end dates" });
            if (err.message === "NO_OCCURRENCES_GENERATED") return res.status(400).json({ message: "No occurrences generated – check days payload and semester dates" });
            if (err.message.startsWith("RESERVATION_CONFLICT:")) {
                const dateStr = err.message.split(":")[1];
                return res.status(400).json({ message: `Conflict: An approved room reservation already occupies this room on ${dateStr} during this time frame.` });
            }
            return res.status(500).json({ message: "Server error", error: err.message });
        }
    }

    async addSingleDateSchedule(req, res) {
        try {
            const { sem_id, room_id, instructor_id, subject_id, year_section_id, start_time, end_time, date } = req.body;
            
            if (!sem_id || !room_id || !instructor_id || !subject_id || !year_section_id || !start_time || !end_time || !date) {
                return res.status(400).json({ message: "All required schedule data and a target date must be provided." });
            }

            const result = await scheduleService.createSingleDateSchedule(req.body);
            
            if (!result.success) {
                return res.status(result.status).json({ message: result.message });
            }

            return res.status(result.status).json({
                message: result.message,
                schedule_id: result.schedule_id
            });

        } catch (err) {
            console.error("Critical error inside addSingleDateSchedule Controller:", err);
            return res.status(500).json({ message: "Server error creating specific date schedule." });
        }
    }

    async getScheduleByRoom(req, res) {
        try {
            const { roomId } = req.params;
            const schedules = await scheduleService.getScheduleByRoom(roomId);
            return res.json(schedules);
        } catch (err) {
            console.error("Error fetching schedules Controller:", err);
            return res.status(500).json({ message: "Server error fetching schedules" });
        }
    }

    async getRoomTimetable(req, res) {
        try {
            const { roomId } = req.params;
            const { weekStart, weekEnd } = req.query;
            const timetableData = await scheduleService.getRoomTimetable(roomId, weekStart, weekEnd);
            return res.json(timetableData);
        } catch (err) {
            console.error("Error fetching timetable Controller:", err);
            if (err.message === "NO_ACTIVE_SEMESTER") return res.status(400).json({ message: "No active semester" });
            return res.status(500).json({ message: "Server error", error: err.message });
        }
    }

    async getAllSchedules(req, res) {
        try {
            const allSchedules = await scheduleService.getAllSchedules();
            return res.json(allSchedules);
        } catch (err) {
            console.error("Error fetching timetable Controller:", err);
            if (err.message === "NO_ACTIVE_SEMESTER") return res.status(400).json({ message: "No active semester" });
            return res.status(500).json({ message: "Server error", error: err.message });
        }
    }

    async updateSchedule(req, res) {
        try {
            const { id } = req.params;
            const { room_id, sem_id, subject_id, year_section_id, schedule_start_time, schedule_end_time, days } = req.body;

            if (!room_id || !sem_id || !subject_id || !year_section_id || !schedule_start_time || !schedule_end_time || !Array.isArray(days) || days.length === 0) {
                return res.status(400).json({ message: "Missing required fields" });
            }

            await scheduleService.updateSchedule(id, req.body);
            return res.json({ message: "Schedule updated successfully" });
        } catch (err) {
            console.error("Error updateSchedule Controller:", err);
            if (err.message === "INVALID_TIME_RANGE") return res.status(400).json({ message: "Invalid time range" });
            if (err.message === "SCHEDULE_OVERLAP") return res.status(400).json({ message: "Conflict: Overlapping schedule." });
            if (err.message.startsWith("RESERVATION_CONFLICT:")) {
                const dateStr = err.message.split(":")[1];
                return res.status(400).json({ message: `Conflict: An approved room reservation already occupies this room on ${dateStr} during this time frame.` });
            }
            return res.status(500).json({ message: "Server error" });
        }
    }

    async deleteSchedules(req, res) {
        try {
            const { ids } = req.query;
            await scheduleService.deleteSchedules(ids);
            return res.json({ message: "Selected schedules deleted successfully" });
        } catch (err) {
            console.error("Error bulk deleting schedules Controller:", err);
            if (err.message === "NO_IDS_PROVIDED") return res.status(400).json({ message: "No schedule IDs provided" });
            return res.status(500).json({ message: "Server error deleting schedules" });
        }
    }

    async deleteSpecificSched(req, res) {
        try {
            const { id } = req.params;
            await scheduleService.deleteSpecificOccurrence(id, req.body);
            return res.json({ message: "Schedule has been removed successfully." });
        } catch (err) {
            console.error("Error deleting specific schedule occurrence Controller:", err);
            if (err.message === "OCCURRENCE_NOT_FOUND") return res.status(404).json({ message: "Occurrence not found" });
            return res.status(500).json({ message: "Server error while deleting schedule." });
        }
    }
}

module.exports = new ScheduleController();