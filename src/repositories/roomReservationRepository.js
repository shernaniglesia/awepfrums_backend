const { pool } = require('../config/db');

class RoomReservationRepository {
    async findAllRoomReservations() {
        const [rows] = await pool.execute(
            `SELECT rr.*, r.room_name, i.instructor_name, s.subject_code, y.year_section_name
            FROM room_reservation rr
            JOIN room r ON rr.room_id = r.room_id
            JOIN instructor i ON rr.instructor_id = i.instructor_id
            JOIN subject s ON rr.subject_id = s.subject_id
            JOIN year_section y ON rr.year_section_id = y.year_section_id
            ORDER BY rr.room_reservation_created_at DESC`
        );
        return rows;
    }

    async findAllUserRoomReservations(instructorId) {
        const [rows] = await pool.execute(
            `SELECT rr.*, r.room_name, i.instructor_name, s.subject_code, y.year_section_name
            FROM room_reservation rr
            JOIN room r ON rr.room_id = r.room_id
            JOIN instructor i ON rr.instructor_id = i.instructor_id
            JOIN subject s ON rr.subject_id = s.subject_id
            JOIN year_section y ON rr.year_section_id = y.year_section_id
            WHERE rr.instructor_id = ?
            ORDER BY rr.room_reservation_created_at DESC`,
            [instructorId]
        );
        return rows;
    }

    async findApprovedRoomReservationsByRoomAndDate(roomId, date) {
        const [rows] = await pool.query(
            `SELECT room_reservation_start_time, room_reservation_end_time 
            FROM room_reservation
            WHERE room_id = ? AND room_reservation_date = ? 
            AND room_reservation_status = 'approved'`,
            [roomId, date]
        );
        return rows;
    }

    async findClassSchedulesByRoomAndDate(roomId, date) {
        const [rows] = await pool.query(
            `SELECT s.schedule_start_time, s.schedule_end_time
            FROM schedule s
            JOIN schedule_per_day spd ON s.schedule_id = spd.schedule_id
            WHERE s.room_id = ? AND spd.schedule_per_day_date = ?`,
            [roomId, date]
        );
        return rows;
    }

    async insertRoomReservation(reservationData) {
        const { sem_id, room_id, user_id, subject_id, year_section_id, date, start_time, end_time } = reservationData;
        const [result] = await pool.execute(
            `INSERT INTO room_reservation 
            (sem_id, room_id, instructor_id, subject_id, year_section_id,
                room_reservation_date, room_reservation_start_time, room_reservation_end_time)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [sem_id, room_id, user_id, subject_id, year_section_id, date, start_time, end_time]
        );
        return result.insertId;
    }

    async findRoomReservationById(id) {
        const [rows] = await pool.query(
            `SELECT * FROM room_reservation WHERE room_reservation_id = ?`,
            [id]
        );
        return rows[0] || null;
    }

    async findConflictingApprovedRoomReservations(roomId, date, excludeId) {
        const [rows] = await pool.query(
            `SELECT * FROM room_reservation 
            WHERE room_id = ? AND room_reservation_date = ? AND room_reservation_status = 'approved' AND room_reservation_id != ?`,
            [roomId, date, excludeId]
        );
        return rows;
    }

    async updateRoomReservationStatus(id, status) {
        const [result] = await pool.query(
            `UPDATE room_reservation SET room_reservation_status = ? WHERE room_reservation_id = ?`,
            [status, id]
        );
        return result.affectedRows > 0;
    }

    async insertSingleDateSchedule(scheduleData, date, dayEnum) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            
            const { sem_id, room_id, instructor_id, subject_id, year_section_id, room_reservation_start_time, room_reservation_end_time } = scheduleData;
            
            const [scheduleResult] = await connection.execute(
                `INSERT INTO schedule 
                (sem_id, room_id, instructor_id, subject_id, year_section_id, schedule_start_time, schedule_end_time)
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [sem_id, room_id, instructor_id, subject_id, year_section_id, room_reservation_start_time, room_reservation_end_time]
            );

            const scheduleId = scheduleResult.insertId;

            await connection.execute(
                `INSERT INTO schedule_per_day 
                (schedule_id, schedule_per_day_date, schedule_per_day_day)
                VALUES (?, ?, ?)`,
                [scheduleId, date, dayEnum]
            );

            await connection.commit();
            return scheduleId;
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    }

    async findAllRoomReservationLogs() {
        const [rows] = await pool.execute(
            `SELECT * FROM room_reservation_log ORDER BY created_at DESC`
        );
        return rows;
    }

    async findAllUserRoomReservationLogs(instructorId) {
        const [rows] = await pool.execute(
            `SELECT * FROM room_reservation_log WHERE instructor_id = ? ORDER BY created_at DESC`,
            [instructorId]
        );
        return rows;
    }

    async insertRoomReservationLog(type, text, iid) {
        await pool.execute(
            `INSERT INTO room_reservation_log
            (room_reservation_log_type, room_reservation_log_action, instructor_id)
            VALUES (?, ?, ?)`,
            [type, text, iid]
        );
    }

    async expirePastRoomReservations(currentDate, currentTime) {
        const [result] = await pool.execute(
            `UPDATE room_reservation 
            SET room_reservation_status = 'expired'
            WHERE room_reservation_status IN ('pending', 'approved')
            AND (
            room_reservation_date < ? 
            OR (room_reservation_date = ? AND room_reservation_end_time < ?)
            )`,
            [currentDate, currentDate, currentTime]
        );
        return result.affectedRows;
    } 
}

module.exports = new RoomReservationRepository();