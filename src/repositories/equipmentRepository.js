const { pool } = require("../config/db");

class EquipmentRepository {
    async findAllEquipment() {
        const [rows] = await pool.query(
            `SELECT equipment_id, equipment_name, equipment_desc, equipment_status
            FROM equipment
            ORDER BY equipment_id DESC`
        );
        return rows;
    }

    async insertEquipment(name, desc, status) {
        const [result] = await pool.query(
            `INSERT INTO equipment (equipment_name, equipment_desc, equipment_status)
            VALUES (?, ?, ?)`,
            [name, desc, status || null]
        );
        return result;
    }

    async updateEquipment(id, name, desc, status) {
        const [result] = await pool.query(
            `UPDATE equipment 
            SET equipment_name = ?, equipment_desc = ?, equipment_status = ?
            WHERE equipment_id = ?`,
            [name, desc, status, id]
        );
        return result.affectedRows > 0;
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
}

module.exports = new EquipmentRepository();