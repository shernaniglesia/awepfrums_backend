const { pool } = require("../config/db");

class ScheduleRepository {
    async fetchActiveSemester() {
        const [rows] = await pool.query("SELECT * FROM sem WHERE sem_active = 1 LIMIT 1");
        return rows[0] || null;
    }

    async fetchSemesterById(connection, sem_id) {
        const db = connection || pool;
        const [rows] = await db.query(
            "SELECT sem_start_date, sem_end_date, sem_active, sem_school_year, sem_semester FROM sem WHERE sem_id = ?",
            [sem_id]
        );
        return rows[0] || null;
    }

    async fetchSchedulesForOverlap(room_id, sem_id, excludeId = null) {
        const params = excludeId ? [room_id, sem_id, excludeId] : [room_id, sem_id];
        const [rows] = await pool.query(
            `SELECT s.schedule_id, s.schedule_start_time, s.schedule_end_time, GROUP_CONCAT(spd.schedule_per_day_day) as days
            FROM schedule s
            JOIN schedule_per_day spd ON s.schedule_id = spd.schedule_id
            WHERE s.room_id = ? AND s.sem_id = ?
              ${excludeId ? "AND s.schedule_id != ?" : ""}
            GROUP BY s.schedule_id`, params
        );
        return rows;
    }

    async fetchApprovedReservations(room_id, dateStr) {
        const [rows] = await pool.query(
            `SELECT room_reservation_id, room_reservation_start_time, room_reservation_end_time 
             FROM room_reservation 
             WHERE room_id = ? 
               AND room_reservation_date = ? 
               AND room_reservation_status = 'approved'`,
            [room_id, dateStr]
        );
        return rows;
    }

    async fetchSchedulesByRoom(roomId) {
        const [rows] = await pool.query(
            `SELECT s.schedule_id, subj.subject_id, subj.subject_code, ins.instructor_id, ins.instructor_name,
                ys.year_section_id, ys.year_section_name, s.schedule_start_time, s.schedule_end_time,
                GROUP_CONCAT(spd.schedule_per_day_day ORDER BY spd.schedule_per_day_date DESC) as days
            FROM schedule s
            LEFT JOIN schedule_per_day spd ON s.schedule_id = spd.schedule_id
            LEFT JOIN subject subj ON s.subject_id = subj.subject_id
            LEFT JOIN instructor ins ON s.instructor_id = ins.instructor_id
            LEFT JOIN year_section ys ON s.year_section_id = ys.year_section_id
            WHERE s.room_id = ?
            GROUP BY s.schedule_id, subj.subject_code, ins.instructor_name, 
                    ys.year_section_name, s.schedule_start_time, s.schedule_end_time
            ORDER BY s.schedule_start_time ASC`,
            [roomId]
        );
        return rows;
    }

    async fetchTimetableSchedules(roomId, semId, start, end) {
        const [rows] = await pool.query(
            `SELECT s.schedule_id, subj.subject_id, subj.subject_code, i.instructor_id, i.instructor_name, ys.year_section_id, ys.year_section_name,
                s.schedule_start_time, s.schedule_end_time, spd.schedule_per_day_id, spd.schedule_per_day_date, spd.schedule_per_day_day
            FROM schedule s
            JOIN subject subj ON s.subject_id = subj.subject_id
            JOIN instructor i ON s.instructor_id = i.instructor_id
            JOIN year_section ys ON s.year_section_id = ys.year_section_id
            JOIN schedule_per_day spd ON s.schedule_id = spd.schedule_id
            WHERE s.room_id = ? AND s.sem_id = ? AND spd.schedule_per_day_date BETWEEN ? AND ?
            ORDER BY spd.schedule_per_day_date, s.schedule_start_time`,
            [roomId, semId, start, end]
        );
        return rows;
    }

    async fetchTimetableReservations(roomId, start, end) {
        const [rows] = await pool.query(
            `SELECT r.room_reservation_id, r.room_reservation_start_time, r.room_reservation_end_time, 
                s.subject_code, i.instructor_id, i.instructor_name, y.year_section_name, 
                r.room_reservation_date, DAYNAME(r.room_reservation_date) AS day_of_week
            FROM room_reservation r
            JOIN subject s ON r.subject_id = s.subject_id
            JOIN instructor i ON r.instructor_id = i.instructor_id
            JOIN year_section y ON r.year_section_id = y.year_section_id
            WHERE r.room_id = ? AND r.room_reservation_status = 'approved' AND r.room_reservation_date BETWEEN ? AND ?
            ORDER BY r.room_reservation_date, r.room_reservation_start_time`,
            [roomId, start, end]
        );
        return rows;
    }

    async fetchAllSchedules(semId) {
        const now = new Date();
        const currentDate = now.toISOString().split('T')[0]; // 'YYYY-MM-DD'
        const currentTime = now.toTimeString().split(' ')[0]; // 'HH:MM:SS'

        const [rows] = await pool.query(
            `SELECT 
                s.schedule_id, 
                s.room_id, 
                r.room_name, 
                subj.subject_id,
                subj.subject_code, 
                i.instructor_id, 
                i.instructor_name, 
                ys.year_section_id,
                ys.year_section_name,
                s.schedule_start_time, 
                s.schedule_end_time, 
                spd.schedule_per_day_id, 
                spd.schedule_per_day_date, 
                spd.schedule_per_day_day
            FROM schedule s
            JOIN room r ON s.room_id = r.room_id
            JOIN subject subj ON s.subject_id = subj.subject_id
            JOIN instructor i ON s.instructor_id = i.instructor_id
            JOIN year_section ys ON s.year_section_id = ys.year_section_id
            JOIN schedule_per_day spd ON s.schedule_id = spd.schedule_id
            WHERE s.sem_id = ? 
            -- Filter out past schedules:
            AND (
                spd.schedule_per_day_date > ? 
                OR (spd.schedule_per_day_date = ? AND s.schedule_end_time >= ?)
            )
            ORDER BY spd.schedule_per_day_date, s.schedule_start_time`,
            [semId, currentDate, currentDate, currentTime]
        );
        return rows;
    }

    async insertSchedule(connection, scheduleData) {
        const db = connection || pool;
        const [result] = await db.query(
            `INSERT INTO schedule 
            (sem_id, room_id, subject_id, instructor_id, year_section_id, schedule_start_time, schedule_end_time)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                scheduleData.sem_id, scheduleData.room_id, scheduleData.subject_id, 
                scheduleData.instructor_id, scheduleData.year_section_id, 
                scheduleData.schedule_start_time, scheduleData.schedule_end_time
            ]
        );
        return result.insertId;
    }

    async insertScheduleDays(connection, occurrences) {
        const db = connection || pool;
        await db.query(
            `INSERT INTO schedule_per_day (schedule_id, schedule_per_day_date, schedule_per_day_day) VALUES ?`,
            [occurrences]
        );
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

    async insertSingleDateSchedule(scheduleData, date, dayEnum) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const { sem_id, room_id, instructor_id, subject_id, year_section_id, start_time, end_time } = scheduleData;

            const [scheduleResult] = await connection.execute(
                `INSERT INTO schedule 
                (sem_id, room_id, instructor_id, subject_id, year_section_id, schedule_start_time, schedule_end_time)
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [sem_id, room_id, instructor_id, subject_id, year_section_id, start_time, end_time]
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

    async updateSchedule(connection, id, data) {
        await connection.query(
            `UPDATE schedule 
            SET room_id=?, subject_id=?, instructor_id=?, year_section_id=?, 
                schedule_start_time=?, schedule_end_time=?
            WHERE schedule_id=?`,
            [data.room_id, data.subject_id, data.instructor_id, data.year_section_id, data.schedule_start_time, data.schedule_end_time, id]
        );
    }

    async deleteScheduleDays(connection, scheduleId) {
        await connection.query(`DELETE FROM schedule_per_day WHERE schedule_id=?`, [scheduleId]);
    }

    async bulkDeleteSchedules(idList) {
        await pool.query(`DELETE FROM schedule WHERE schedule_id IN (?)`, [idList]);
    }

    async fetchOccurrenceDetails(id) {
        const [rows] = await pool.query(
            `SELECT spd.*, s.schedule_start_time, s.schedule_end_time, subj.subject_code, r.room_name
            FROM schedule_per_day spd
            JOIN schedule s ON spd.schedule_id = s.schedule_id
            JOIN subject subj ON s.subject_id = subj.subject_id
            JOIN room r ON s.room_id = r.room_id
            WHERE spd.schedule_per_day_id = ?`,
            [id]
        );
        return rows[0] || null;
    }

    async deleteSpecificOccurrence(id) {
        await pool.query(`DELETE FROM schedule_per_day WHERE schedule_per_day_id = ?`, [id]);
    }

    async getConnection() {
        return await pool.getConnection();
    }
}

module.exports = new ScheduleRepository();