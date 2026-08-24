const semesterService = require("../services/semesterService");

class SemesterController {
    async getActiveSem(_req, res) {
        try {
            const data = await semesterService.getActiveSemester();
            return res.json(data);
        } catch (err) {
            console.error("Error in SemesterController.getActiveSem:", err);
            if (err.message === "ACTIVE_SEMESTER_NOT_FOUND") {
                return res.status(404).json({ message: "No active semester." });
            }
            return res.status(500).json({ message: "Error fetching active semester." });
        }
    }

    async listSem(_req, res) {
        try {
            const rows = await semesterService.getAllSemesters();
            return res.json(rows);
        } catch (e) {
            console.error("Error in SemesterController.listSem:", e);
            return res.status(500).json({ message: "Error fetching semesters." });
        }
    }

    async setActiveSem(req, res) {
        try {
            const { id } = req.params;
            await semesterService.changeActiveSemester(id);
            return res.json({ message: "Active semester updated successfully" });
        } catch (err) {
            console.error("Error in SemesterController.setActiveSem:", err);
            return res.status(500).json({ message: "Error setting active semester" });
        }
    }

    async createSem(req, res) {
        try {
            const { semester, schoolYear, startDate, endDate } = req.body;
            const insertId = await semesterService.addSemester({ semester, schoolYear, startDate, endDate });
            
            return res.json({ 
                message: "Semester created successfully", 
                semester_id: insertId 
            });
        } catch (err) {
            console.error("Error in SemesterController.createSem:", err);
            if (err.message === "MISSING_REQUIRED_FIELDS") {
                return res.status(400).json({ message: "Missing fields" });
            }
            return res.status(500).json({ message: "Error creating semester" });
        }
    }

    async updateSem(req, res) {
        try {
            const { id } = req.params;
            const { semester, schoolYear, startDate, endDate } = req.body;
            
            await semesterService.modifySemester(id, { semester, schoolYear, startDate, endDate });
            return res.json({ message: "Semester updated successfully" });
        } catch (e) {
            console.error("Error in SemesterController.updateSem:", e);
            return res.status(500).json({ message: "Error updating semester" });
        }
    }
}

module.exports = new SemesterController();