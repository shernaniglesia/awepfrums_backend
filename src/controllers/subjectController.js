const subjectService = require("../services/subjectService");

class SubjectController {
    async getSubject(req, res) {
        try {
            const rows = await subjectService.getAllSubjects();
            return res.json(rows);
        } catch (err) {
            console.error("Error inside SubjectController.getSubject:", err);
            return res.status(500).json({ message: "Server error fetching subjects" });
        }
    }

    async createSubject(req, res) {
        try {
            const { subjectCode } = req.body;
            const insertId = await subjectService.addSubject(subjectCode);
            
            return res.status(201).json({ 
                message: "Subject added successfully", 
                subject_id: insertId 
            });
        } catch (err) {
            console.error("Error inside SubjectController.createSubject:", err);
            if (err.message === "SUBJECT_CODE_REQUIRED") {
                return res.status(400).json({ message: "Subject code is required" });
            }
            return res.status(500).json({ message: "Server error adding subject" });
        }
    }

    async updateSubject(req, res) {
        try {
            const { id } = req.params;
            const { subjectCode } = req.body;
            
            await subjectService.modifySubject(id, subjectCode);
            return res.json({ message: "Subject updated successfully" });
        } catch (err) {
            console.error("Error inside SubjectController.updateSubject:", err);
            if (err.message === "SUBJECT_CODE_REQUIRED") {
                return res.status(400).json({ message: "Subject code is required" });
            }
            if (err.message === "SUBJECT_NOT_FOUND") {
                return res.status(404).json({ message: "Subject not found" });
            }
            return res.status(500).json({ message: "Server error updating subject" });
        }
    }
}

module.exports = new SubjectController();