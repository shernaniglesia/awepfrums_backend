const yearSectionService = require("../services/yearSectionService");

class YearSectionController {
    async getYearSection(req, res) {
        try {
            const data = await yearSectionService.getAllYearSections();
            return res.json(data);
        } catch (err) {
            console.error("Error in YearSectionController.getYearSection:", err);
            return res.status(500).json({ message: "Server error while fetching year sections" });
        }
    }

    async createYearSection(req, res) {
        try {
            const { yearSectionName } = req.body;
            await yearSectionService.addYearSection(yearSectionName);
            return res.json({ message: "Year & Section added successfully" });
        } catch (err) {
            console.error("Error in YearSectionController.createYearSection:", err);
            if (err.message === "YEAR_SECTION_NAME_REQUIRED") {
                return res.status(400).json({ message: "Year & Section name is required" });
            }
            return res.status(500).json({ message: "Server error while creating year section" });
        }
    }

    async updateYearSection(req, res) {
        try {
            const { id } = req.params;
            const { yearSectionName } = req.body;

            await yearSectionService.modifyYearSection(id, yearSectionName);
            return res.json({ message: "Year & Section updated successfully" });
        } catch (err) {
            console.error("Error in YearSectionController.updateYearSection:", err);
            if (err.message === "YEAR_SECTION_NAME_REQUIRED") {
                return res.status(400).json({ message: "Year & Section name is required" });
            }
            if (err.message === "YEAR_SECTION_NOT_FOUND") {
                return res.status(404).json({ message: "Year & Section not found" });
            }
            return res.status(500).json({ message: "Server error while updating year section" });
        }
    }
}

module.exports = new YearSectionController();