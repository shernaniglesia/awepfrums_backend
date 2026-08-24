const subjectRepository = require("../repositories/subjectRepository");

class SubjectService {
    async getAllSubjects() {
        return await subjectRepository.fetchAllSubjectsSorted();
    }

    async addSubject(subjectCode) {
        if (!subjectCode) {
            throw new Error("SUBJECT_CODE_REQUIRED");
        }
        
        const capitalizedCode = subjectCode.toUpperCase();
        return await subjectRepository.insertSubject(capitalizedCode);
    }

    async modifySubject(id, subjectCode) {
        if (!subjectCode) {
            throw new Error("SUBJECT_CODE_REQUIRED");
        }

        const isUpdated = await subjectRepository.updateSubjectFields(id, subjectCode);
        if (!isUpdated) {
            throw new Error("SUBJECT_NOT_FOUND");
        }
        return true;
    }
}

module.exports = new SubjectService();