const { pool } = require("../config/db");

class UserRepository {
    async findByEmail(email, role) {
        const [rows] = await pool.query(`
            SELECT ${role}_id AS id, ${role}_name AS name, ${role}_password AS password, is_verified 
            FROM ${role} 
            WHERE ${role}_email = ?
        `, [email]);
        return rows[0];
    }

    async findById(id, role) {
        const [rows] = await pool.query(`
            SELECT ${role}_id AS id, ${role}_name AS name, ${role}_password AS password, ${role}_email AS email 
            FROM ${role} 
            WHERE ${role}_id = ?
        `, [id]);
        return rows[0];
    }

    async fetchAllVerifiedAdmins() {
        const [rows] = await pool.query("SELECT admin_id AS id, admin_name AS name, admin_email AS email, 'Admin' AS role FROM admin WHERE is_verified = 1");
        return rows;
    }

    async fetchAllVerifiedInstructors() {
        const [rows] = await pool.query("SELECT instructor_id AS id, instructor_name AS name, instructor_email AS email, 'Instructor' AS role FROM instructor WHERE instructor_name != 'TBA' AND is_verified = 1");
        return rows;
    }

    async fetchAllVerifiedStudents() {
        const [rows] = await pool.query("SELECT student_id AS id, student_name AS name, student_email AS email, 'Student' AS role FROM student WHERE is_verified = 1");
        return rows;
    }

    async fetchAllRawInstructors() {
        const [rows] = await pool.query("SELECT * FROM instructor ORDER BY instructor_name ASC");
        return rows;
    }

    async insertUser(name, email, hashedPassword, role) {
        const sql = `INSERT INTO ${role} (${role}_name, ${role}_email, ${role}_password, is_verified) VALUES (?, ?, ?, 1)`;
        const [result] = await pool.query(sql, [name, email, hashedPassword]);
        return result.insertId;
    }

    async updateUserFields(id, name, email, role) {
        const [result] = await pool.query(`
            UPDATE ${role} SET ${role}_name = ?, ${role}_email = ? WHERE ${role}_id = ?
        `, [name, email, id]);
        return result.affectedRows > 0;
    }

    async updatePassword(id, hashedPassword, role) {
        await pool.query(`
            UPDATE ${role} SET ${role}_password = ? WHERE ${role}_id = ?
        `, [hashedPassword, id]);
        return true;
    }
}

module.exports = new UserRepository();
