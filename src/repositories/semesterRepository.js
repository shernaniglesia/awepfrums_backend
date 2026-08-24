const { pool } = require("../config/db");

class SemesterRepository {
    async fetchActiveSemester() {
        const [rows] = await pool.query(
            "SELECT sem_id, sem_semester, sem_school_year, sem_start_date, sem_end_date, sem_active FROM sem WHERE sem_active = 1 LIMIT 1"
        );
        return rows[0];
    }

    async fetchAllSemestersSorted() {
        const [rows] = await pool.query(
            "SELECT * FROM sem ORDER BY sem_active DESC"
        );
        return rows;
    }

    async updateActiveSemesterState(id) {
        await pool.query("UPDATE sem SET sem_active = 0");
        const [result] = await pool.query("UPDATE sem SET sem_active = 1 WHERE sem_id = ?", [id]);
        return result.affectedRows > 0;
    }

    async insertSemester({ semester, schoolYear, startDate, endDate }) {
        const [result] = await pool.query(
            `INSERT INTO sem (sem_semester, sem_school_year, sem_start_date, sem_end_date, sem_active)
            VALUES (?, ?, ?, ?, 0)`,
            [semester, schoolYear, startDate, endDate]
        );
        return result.insertId;
    }

    async updateSemesterFields(id, { semester, schoolYear, startDate, endDate }) {
        const [result] = await pool.query(
            "UPDATE sem SET sem_semester = ?, sem_school_year = ?, sem_start_date = ?, sem_end_date = ? WHERE sem_id = ?",
            [semester, schoolYear, startDate, endDate, id]
        );
        return result.affectedRows > 0;
    }
}

module.exports = new SemesterRepository();