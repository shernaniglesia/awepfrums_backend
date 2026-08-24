const { pool } = require("../config/db");

class YearSectionRepository {
    async fetchAllSorted() {
        const [rows] = await pool.query(
            "SELECT * FROM year_section ORDER BY year_section_name ASC"
        );
        return rows;
    }

    async insert(yearSectionName) {
        const [result] = await pool.query(
            "INSERT INTO year_section (year_section_name) VALUES (?)", 
            [yearSectionName]
        );
        return result.insertId;
    }

    async updateFields(id, yearSectionName) {
        const [result] = await pool.query(
            "UPDATE year_section SET year_section_name = ? WHERE year_section_id = ?",
            [yearSectionName, id]
        );
        return result.affectedRows > 0;
    }
}

module.exports = new YearSectionRepository();