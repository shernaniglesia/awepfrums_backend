const semesterRepository = require("../repositories/semesterRepository");

class SemesterService {
    async getActiveSemester() {
        const activeSem = await semesterRepository.fetchActiveSemester();
        if (!activeSem) {
            throw new Error("ACTIVE_SEMESTER_NOT_FOUND");
        }
        return activeSem;
    }

    async getAllSemesters() {
        return await semesterRepository.fetchAllSemestersSorted();
    }

    async changeActiveSemester(id) {
        return await semesterRepository.updateActiveSemesterState(id);
    }

    async addSemester(semesterData) {
        const { semester, schoolYear, startDate, endDate } = semesterData;
        if (!semester || !schoolYear || !startDate || !endDate) {
            throw new Error("MISSING_REQUIRED_FIELDS");
        }
        return await semesterRepository.insertSemester({ semester, schoolYear, startDate, endDate });
    }

    async modifySemester(id, semesterData) {
        return await semesterRepository.updateSemesterFields(id, semesterData);
    }
}

module.exports = new SemesterService();