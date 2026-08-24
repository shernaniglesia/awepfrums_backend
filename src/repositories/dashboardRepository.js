const { pool } = require("../config/db");

class StatsRepository {
    async getGlobalAdminStats() {
        const [rows] = await pool.query(`
            SELECT
                ((SELECT COUNT(*) FROM admin) + (SELECT COUNT(*) FROM student) + (SELECT COUNT(*) FROM instructor)) AS total_users,
                (SELECT COUNT(*) FROM admin) AS total_admins,
                (SELECT COUNT(*) FROM student) AS total_students,
                (SELECT COUNT(*) FROM instructor) AS total_instructors,
                (SELECT COUNT(*) FROM room) AS total_rooms,
                (SELECT COUNT(*) FROM room_reservation) AS total_room_reservations,
                (SELECT COUNT(*) FROM room_reservation WHERE room_reservation_status = 'approved') AS total_approved_room_reservations,
                (SELECT COUNT(*) FROM room_reservation WHERE room_reservation_status = 'pending') AS total_pending_room_reservations,
                (SELECT COUNT(*) FROM equipment) AS total_equipments,
                (SELECT COUNT(*) FROM equipment_reservation) AS total_equipment_reservations,
                (SELECT COUNT(*) FROM equipment_reservation WHERE equipment_reservation_status = 'borrowed') AS total_unreturn_equipment,
                (SELECT COUNT(*) FROM equipment_reservation WHERE equipment_reservation_status = 'pending') AS total_pending_equipment_reservations
        `);
        return rows[0];
    }

    async getInstructorStatsById(instructorId) {
        const [rows] = await pool.query(`
            SELECT
                (SELECT COUNT(*) FROM room_reservation WHERE instructor_id = ?) AS total_room_reservations,
                (SELECT COUNT(*) FROM room_reservation WHERE instructor_id = ? AND room_reservation_status = 'approved') AS total_approved_room_reservations,
                (SELECT COUNT(*) FROM room_reservation WHERE instructor_id = ? AND room_reservation_status = 'pending') AS total_pending_room_reservations,
                (SELECT COUNT(*) FROM equipment_reservation WHERE equipment_reservation_user_type = 'instructor' AND equipment_reservation_reference_id = ?) AS total_equipment_reservations,
                (SELECT COUNT(*) FROM equipment_reservation WHERE equipment_reservation_user_type = 'instructor' AND equipment_reservation_reference_id = ? AND equipment_reservation_status = 'borrowed') AS total_unreturn_equipment,
                (SELECT COUNT(*) FROM equipment_reservation WHERE equipment_reservation_user_type = 'instructor' AND equipment_reservation_reference_id = ? AND equipment_reservation_status = 'pending') AS total_pending_equipment_reservations
        `, [instructorId, instructorId, instructorId, instructorId, instructorId, instructorId]);
        return rows[0];
    }

    async getStudentStatsById(studentId) {
        const [rows] = await pool.query(`
            SELECT
                (SELECT COUNT(*) FROM equipment_reservation WHERE equipment_reservation_user_type = 'student' AND equipment_reservation_reference_id = ?) AS total_equipment_reservations,
                (SELECT COUNT(*) FROM equipment_reservation WHERE equipment_reservation_user_type = 'student' AND equipment_reservation_reference_id = ? AND equipment_reservation_status = 'borrowed') AS total_unreturn_equipment,
                (SELECT COUNT(*) FROM equipment_reservation WHERE equipment_reservation_user_type = 'student' AND equipment_reservation_reference_id = ? AND equipment_reservation_status = 'pending') AS total_pending_equipment_reservations
        `, [studentId, studentId, studentId]);
        return rows[0];
    }
}

module.exports = new StatsRepository();