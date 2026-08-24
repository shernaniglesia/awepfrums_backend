const yearSectionRepository = require("../repositories/yearSectionRepository");

class YearSectionService {
    async getAllYearSections() {
        return await yearSectionRepository.fetchAllSorted();
    }

    async addYearSection(yearSectionName) {
        if (!yearSectionName) {
            throw new Error("YEAR_SECTION_NAME_REQUIRED");
        }
        
        const capitalized = yearSectionName.toUpperCase();
        return await yearSectionRepository.insert(capitalized);
    }

    async modifyYearSection(id, yearSectionName) {
        if (!yearSectionName) {
            throw new Error("YEAR_SECTION_NAME_REQUIRED");
        }

        const isUpdated = await yearSectionRepository.updateFields(id, yearSectionName);
        if (!isUpdated) {
            throw new Error("YEAR_SECTION_NOT_FOUND");
        }
        return true;
    }
}

module.exports = new YearSectionService();