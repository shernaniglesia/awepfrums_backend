const statsRepository = require("../repositories/dashboardRepository");

class StatsService {
    async getAdminDashboardStats() {
        return await statsRepository.getGlobalAdminStats();
    }

    async getInstructorDashboardStats(instructorId) {
        if (!instructorId) throw new Error("Instructor identification parameter is required");
        return await statsRepository.getInstructorStatsById(instructorId);
    }

    async getStudentDashboardStats(studentId) {
        if (!studentId) throw new Error("Student identification parameter is required");
        return await statsRepository.getStudentStatsById(studentId);
    }
}

module.exports = new StatsService();