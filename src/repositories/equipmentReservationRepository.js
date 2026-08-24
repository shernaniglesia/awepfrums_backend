const { pool } = require("../config/db");

class EquipmentReservationRepository {
    async findAllEquipmentReservations() {
        const [rows] = await pool.query(`
            SELECT 
                er.equipment_reservation_id,
                e.equipment_name,
                er.equipment_reservation_user_type,
                er.equipment_reservation_reference_id,
                CASE
                    WHEN er.equipment_reservation_user_type = 'student' THEN s.student_name
                    WHEN er.equipment_reservation_user_type = 'instructor' THEN i.instructor_name
                    WHEN er.equipment_reservation_user_type = 'admin' THEN a.admin_name
                END AS user_name,
                er.equipment_reservation_date,
                er.equipment_reservation_start_time,
                er.equipment_reservation_end_time,
                er.equipment_reservation_status,
                er.equipment_reservation_created_at
            FROM equipment_reservation er
            INNER JOIN equipment e ON e.equipment_id = er.equipment_id
            LEFT JOIN student s ON s.student_id = er.equipment_reservation_reference_id AND er.equipment_reservation_user_type = 'student'
            LEFT JOIN instructor i ON i.instructor_id = er.equipment_reservation_reference_id AND er.equipment_reservation_user_type = 'instructor'
            LEFT JOIN admin a ON a.admin_id = er.equipment_reservation_reference_id AND er.equipment_reservation_user_type = 'admin'
            ORDER BY er.equipment_reservation_created_at DESC
        `);
        return rows;
    }

    async findAllUserEquipmentReservations(role, userId) {
        const [rows] = await pool.query(`
            SELECT 
                er.equipment_reservation_id,
                e.equipment_name,
                er.equipment_reservation_user_type,
                er.equipment_reservation_reference_id,
                CASE
                    WHEN er.equipment_reservation_user_type = 'student' THEN s.student_name
                    WHEN er.equipment_reservation_user_type = 'instructor' THEN i.instructor_name
                    WHEN er.equipment_reservation_user_type = 'admin' THEN a.admin_name
                END AS user_name,
                er.equipment_reservation_date,
                er.equipment_reservation_start_time,
                er.equipment_reservation_end_time,
                er.equipment_reservation_status,
                er.equipment_reservation_created_at
            FROM equipment_reservation er
            INNER JOIN equipment e ON e.equipment_id = er.equipment_id
            LEFT JOIN student s ON s.student_id = er.equipment_reservation_reference_id AND er.equipment_reservation_user_type = 'student'
            LEFT JOIN instructor i ON i.instructor_id = er.equipment_reservation_reference_id AND er.equipment_reservation_user_type = 'instructor'
            LEFT JOIN admin a ON a.admin_id = er.equipment_reservation_reference_id AND er.equipment_reservation_user_type = 'admin'
            WHERE er.equipment_reservation_user_type = ? 
                AND er.equipment_reservation_reference_id = ?
            ORDER BY er.equipment_reservation_created_at DESC
        `, [role, userId]);
        
        return rows;
    }

    async findEquipmentReservationById(id) {
        const [rows] = await pool.execute(
            `SELECT * FROM equipment_reservation WHERE equipment_reservation_id = ?`,
            [id]
        );
        return rows[0] || null;
    }

    async findApprovedEquipmentReservationsByEquipmentAndDate(equipmentId, date, excludeId = null) {
        let query = `SELECT * FROM equipment_reservation 
                    WHERE equipment_id = ? AND equipment_reservation_date = ? 
                    AND equipment_reservation_status = 'approved'`;
        const params = [equipmentId, date];

        if (excludeId) {
            query += ` AND equipment_reservation_id != ?`;
            params.push(excludeId);
        }

        const [rows] = await pool.execute(query, params);
        return rows;
    }

    async findActiveBorrowsByEquipment(equipmentId) {
        const [rows] = await pool.execute(`
            SELECT er.*, 
                CASE 
                WHEN er.equipment_reservation_user_type = 'student' THEN s.student_name
                WHEN er.equipment_reservation_user_type = 'instructor' THEN i.instructor_name
                WHEN er.equipment_reservation_user_type = 'admin' THEN a.admin_name
                END as borrower_name
            FROM equipment_reservation er
            LEFT JOIN student s ON s.student_id = er.equipment_reservation_reference_id AND er.equipment_reservation_user_type = 'student'
            LEFT JOIN instructor i ON i.instructor_id = er.equipment_reservation_reference_id AND er.equipment_reservation_user_type = 'instructor'
            LEFT JOIN admin a ON a.admin_id = er.equipment_reservation_reference_id AND er.equipment_reservation_user_type = 'admin'
            WHERE er.equipment_id = ? AND er.equipment_reservation_status = 'borrowed'
            `, [equipmentId]);
        return rows;
    }

    async insertEquipmentReservation(data) {
        const { equipment_id, equipment_reservation_user_type, equipment_reservation_reference_id, equipment_reservation_date, equipment_reservation_start_time, equipment_reservation_end_time } = data;
        const [result] = await pool.execute(
            `INSERT INTO equipment_reservation
                (equipment_id, equipment_reservation_user_type, equipment_reservation_reference_id, 
                equipment_reservation_date, equipment_reservation_start_time, equipment_reservation_end_time, 
                equipment_reservation_status) VALUES (?,?,?,?,?,?,'pending')`,
            [equipment_id, equipment_reservation_user_type, equipment_reservation_reference_id, equipment_reservation_date, equipment_reservation_start_time, equipment_reservation_end_time]
        );
        return result.insertId;
    }

    async updateEquipmentReservationStatus(id, status) {
        const [result] = await pool.execute(
            `UPDATE equipment_reservation SET equipment_reservation_status = ? WHERE equipment_reservation_id = ?`,
            [status, id]
        );
        return result.affectedRows > 0;
    }

    async insertEquipmentReservationLog(type, text, role, id) {
        await pool.execute(`
            INSERT INTO equipment_reservation_log
            (equipment_reservation_log_type, equipment_reservation_log_action, equipment_reservation_user_type, equipment_reservation_reference_id)
            VALUES (?, ?, ?, ?)
            `, [type, text, role, id]);
    }

    async findAllEquipmentReservationLogs() {
        const [rows] = await pool.execute(
            `SELECT * FROM equipment_reservation_log ORDER BY created_at DESC`
        );
        return rows;
    }

    async findAllUserEquipmentReservationLogs(role, userId) {
        const [rows] = await pool.query(`
            SELECT *
            FROM equipment_reservation_log
            WHERE equipment_reservation_user_type = ? 
                AND equipment_reservation_reference_id = ?
            ORDER BY created_at DESC
            `, [role, userId]);
        
        return rows;
    }

    async findAllEquipmentReservationQueue(equipmentId) {
        const [rows] = await pool.query(
            `SELECT 
                er.equipment_reservation_id,
                e.equipment_name,
                er.equipment_reservation_user_type AS borrower_role,
                er.equipment_reservation_reference_id,
                CASE
                    WHEN er.equipment_reservation_user_type = 'student' THEN s.student_name
                    WHEN er.equipment_reservation_user_type = 'instructor' THEN i.instructor_name
                    WHEN er.equipment_reservation_user_type = 'admin' THEN a.admin_name
                END AS borrower_name,
                er.equipment_reservation_date,
                er.equipment_reservation_start_time AS start_time,
                er.equipment_reservation_end_time AS end_time,
                er.equipment_reservation_status AS status
            FROM equipment_reservation er
            INNER JOIN equipment e ON e.equipment_id = er.equipment_id
            LEFT JOIN student s ON s.student_id = er.equipment_reservation_reference_id AND er.equipment_reservation_user_type = 'student'
            LEFT JOIN instructor i ON i.instructor_id = er.equipment_reservation_reference_id AND er.equipment_reservation_user_type = 'instructor'
            LEFT JOIN admin a ON a.admin_id = er.equipment_reservation_reference_id AND er.equipment_reservation_user_type = 'admin'
            WHERE er.equipment_id = ? 
                AND er.equipment_reservation_date = CURDATE()
                AND er.equipment_reservation_status IN ('approved', 'borrowed')
            ORDER BY er.equipment_reservation_start_time ASC`,
            [equipmentId]
        );
        return rows;
    }

    async expirePastEquipmentReservations(currentDate, currentTime) {
        const [result] = await pool.execute(
            `UPDATE equipment_reservation 
            SET equipment_reservation_status = 'expired'
            WHERE equipment_reservation_status IN ('pending', 'approved', 'borrowed')
            AND (
                equipment_reservation_date < ? 
                OR (equipment_reservation_date = ? AND equipment_reservation_end_time < ?)
            )`,
            [currentDate, currentDate, currentTime]
        );
        return result.affectedRows;
    }
}

module.exports = new EquipmentReservationRepository();