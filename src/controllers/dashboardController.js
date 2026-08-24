const statsService = require("../services/dashboardService");

class StatsController {
    async getStatsAdmin(req, res) {
        try {
            const data = await statsService.getAdminDashboardStats();
            return res.status(200).json({ success: true, data });
        } catch (error) {
            console.error("Error inside StatsController.getStatsAdmin:", error);
            return res.status(500).json({ success: false, message: "Server Error" });
        }
    }

    async getStatsInstructor(req, res) {
        try {
            const { id } = req.params;
            const data = await statsService.getInstructorDashboardStats(id);
            return res.status(200).json({ success: true, data });
        } catch (error) {
            console.error("Error inside StatsController.getStatsInstructor:", error);
            return res.status(500).json({ success: false, message: "Server Error" });
        }
    }

    async getStatsStudent(req, res) {
        try {
            const { id } = req.params;
            const data = await statsService.getStudentDashboardStats(id);
            return res.status(200).json({ success: true, data });
        } catch (error) {
            console.error("Error inside StatsController.getStatsStudent:", error);
            return res.status(500).json({ success: false, message: "Server Error" });
        }
    }
}

module.exports = new StatsController();