const changeService = require("../services/scheduleChangeService");

class ScheduleChangeController {
    async requestScheduleAction(req, res) {
        try {
            const { type, sourceSchedPerDayId, sourceInstId, sourceName,
                targetSchedPerDayId, targetInstId, targetName,
                targetSubjectId, targetYearSectionId, 
                sourceSubjectId, sourceYearSectionId, 
                sourceRoomName, sourceDate, sourceStartTime, sourceEndTime,
                targetRoomName, targetDate, targetStartTime, targetEndTime, } = req.body;
                
            if (!type || !sourceSchedPerDayId || !sourceInstId || !targetInstId) {
                return res.status(400).json({ message: "Missing required parameters configuration fields." });
            }

            if(type === 'request') {
                if(!sourceSubjectId || !sourceYearSectionId){
                return res.status(400).json({ message: "Missing required parameters configuration fields." });
                }
            }
            const result = await changeService.submitChangeRequest(req.body);
            return res.status(result.status).json({ message: result.message, request_id: result.request_id || null });
        } catch (err) {
            console.error("Error in requestScheduleAction Controller:", err);
            return res.status(500).json({ message: "Server error initiating schedule change request." });
        }
    }

    async respondToRequest(req, res) {
        try {
            const { id } = req.params; // Request ID
            const { instructor_id, action, subjectId, yearSectionId, sourceName, sourceRoomName, sourceDate, sourceStartTime, sourceEndTime, 
                    targetName, targetRoomName, targetDate, targetStartTime, targetEndTime, } = req.body;

            if (!instructor_id || !action) {
                return res.status(400).json({ message: "Instructor ID identity context and action parameters are required." });
            }

            const result = await changeService.processRequestAction(id, instructor_id, action, subjectId, yearSectionId, 
                sourceName, sourceRoomName, sourceDate, sourceStartTime, sourceEndTime, 
                targetName, targetRoomName, targetDate, targetStartTime, targetEndTime,);

            return res.status(result.status).json({ message: result.message });
        } catch (err) {
            console.error("Error in respondToRequest Controller:", err);
            return res.status(500).json({ message: "Server error executing schedule change authorization changes." });
        }
    }

    async getInbox(req, res) {
        try {
            const { instructor_id } = req.params;
            if (!instructor_id) {
                return res.status(400).json({ message: "Instructor ID parameter is required." });
            }

            const result = await changeService.getInstructorInbox(instructor_id);
            return res.status(result.status).json(result.data);
        } catch (err) {
            console.error("Error in getInbox Controller:", err);
            return res.status(500).json({ message: "Server error fetching schedule requests inbox." });
        }
    }
}

module.exports = new ScheduleChangeController();