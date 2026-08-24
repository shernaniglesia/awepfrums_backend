const { pool } = require("../config/db");

class AuthRepository {
    async findUserByEmail(email, role) {
        const [rows] = await pool.query(`
            SELECT ${role}_id AS user_id, ${role}_name AS user_name, ${role}_email AS user_email,
                   ${role}_password AS user_password, is_verified, '${role}' AS user_role
            FROM ${role} WHERE ${role}_email = ?
        `, [email]);
        return rows[0];
    }

    async createUser(name, email, hashedPassword, role) {
        return await pool.query(`
            INSERT INTO ${role} (${role}_name, ${role}_email, ${role}_password, is_verified)
            VALUES (?, ?, ?, 0)
        `, [name, email, hashedPassword]);
    }

    async verifyUserEmail(email, role) {
        return await pool.query(`
            UPDATE ${role} SET is_verified = 1 WHERE ${role}_email = ?
        `, [email]);
    }

    async updatePassword(email, role, hashedPassword) {
        return await pool.query(`
            UPDATE ${role} SET ${role}_password = ? WHERE ${role}_email = ?
        `, [hashedPassword, email]);
    }

    async saveRefreshToken(userId, role, token, expiresAt) {
        return await pool.query(
            'INSERT INTO refresh_tokens (user_id, role, token, expires_at) VALUES (?, ?, ?, ?)',
            [userId, role, token, expiresAt]
        );
    }

    async findRefreshToken(token) {
        const [rows] = await pool.query(
            'SELECT * FROM refresh_tokens WHERE token = ? AND expires_at > NOW()',
            [token]
        );
        return rows[0];
    }

    async deleteRefreshToken(token) {
        return await pool.query('DELETE FROM refresh_tokens WHERE token = ?', [token]);
    }
}

module.exports = new AuthRepository();