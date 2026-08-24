const { pool } = require("../config/db");

class SubjectRepository {
    async fetchAllSubjectsSorted() {
        const [rows] = await pool.query(
            "SELECT * FROM subject ORDER BY subject_code ASC"
        );
        return rows;
    }

    async insertSubject(subjectCode) {
        const [result] = await pool.query(
            "INSERT INTO subject (subject_code) VALUES (?)",
            [subjectCode]
        );
        return result.insertId;
    }

    async updateSubjectFields(id, subjectCode) {
        const [result] = await pool.query(
            "UPDATE subject SET subject_code = ? WHERE subject_id = ?",
            [subjectCode, id]
        );
        return result.affectedRows > 0;
    }
}

module.exports = new SubjectRepository();