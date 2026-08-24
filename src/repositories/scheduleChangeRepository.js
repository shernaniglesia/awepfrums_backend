const { pool } = require("../config/db");

class ScheduleChangeRepository {
    async createRequest(data) {
        const { type, sourceSchedPerDayId, sourceInstId, targetSchedPerDayId, targetInstId, targetSubjectId, targetYearSectionId, sourceSubjectId, sourceYearSectionId } = data;

        const [result] = await pool.execute(
            `INSERT INTO schedule_change_requests 
            (request_type, source_schedule_per_day_id, source_instructor_id, target_schedule_per_day_id, target_instructor_id, target_subject_id, target_year_section_id, source_subject_id, source_year_section_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [type, sourceSchedPerDayId, sourceInstId, targetSchedPerDayId || null, targetInstId, targetSubjectId || null, targetYearSectionId || null, sourceSubjectId || null, sourceYearSectionId || null]
        );
        return result.insertId;
    }

    async findRequestById(id) {
        const [rows] = await pool.query(
        `SELECT * FROM schedule_change_requests WHERE request_id = ?`, [id]
        );
        return rows[0] || null;
    }

    async updateRequestStatus(id, status) {
        await pool.execute(
        `UPDATE schedule_change_requests SET status = ? WHERE request_id = ?`,
        [status, id]
        );
    }

    async executeScheduleOwnershipSwap(request, subjectId, yearSectionId) {
    const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Helper function to split a single date off from its parent schedule
            const detachAndAssignNewSchedule = async (schedulePerDayId, newInstructorId, newSubjectId, newYearSecId) => {
            // Fetch existing parent schedule details (to retain sem_id, room_id, times)
            const [[original]] = await connection.execute(
                `SELECT s.sem_id, s.room_id, s.schedule_start_time, s.schedule_end_time
                FROM schedule_per_day spd
                JOIN schedule s ON spd.schedule_id = s.schedule_id
                WHERE spd.schedule_per_day_id = ?`,
                [schedulePerDayId]
            );

            if (!original) {
                throw new Error(`Schedule occurrence with ID ${schedulePerDayId} not found.`);
            }

            //Create a new independent parent schedule for this specific swap/transfer
            const [newSchedResult] = await connection.execute(
                `INSERT INTO schedule 
                (sem_id, room_id, instructor_id, subject_id, year_section_id, schedule_start_time, schedule_end_time)
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                original.sem_id,
                original.room_id,
                newInstructorId,
                newSubjectId,
                newYearSecId,
                original.schedule_start_time,
                original.schedule_end_time
                ]
            );

            const newScheduleId = newSchedResult.insertId;

            // Update ONLY the target single-day occurrence to point to the new schedule
            await connection.execute(
                `UPDATE schedule_per_day 
                SET schedule_id = ? 
                WHERE schedule_per_day_id = ?`,
                [newScheduleId, schedulePerDayId]
            );
            };

            // Execute swap / transfer based on request type
            if (request.request_type === 'swap') {
            // Swap source schedule occurrence to target details
            await detachAndAssignNewSchedule(
                request.source_schedule_per_day_id,
                request.target_instructor_id,
                request.target_subject_id,
                request.target_year_section_id
            );

            // Swap target schedule occurrence to source details
            await detachAndAssignNewSchedule(
                request.target_schedule_per_day_id,
                request.source_instructor_id,
                request.source_subject_id,
                request.source_year_section_id
            );

            } else if (request.request_type === 'give') {
            // Transfer source single-day occurrence to target instructor
            await detachAndAssignNewSchedule(
                request.source_schedule_per_day_id,
                request.target_instructor_id,
                subjectId,
                yearSectionId
            );

            } else if (request.request_type === 'request') {
            // Claim source single-day occurrence for requesting target instructor
            await detachAndAssignNewSchedule(
                request.source_schedule_per_day_id,
                request.target_instructor_id,
                request.source_subject_id,
                request.source_year_section_id
            );
            }

            await connection.commit();
            return true;
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    }

    async findSentRequests(instructorId) {
        const [rows] = await pool.query(`
        SELECT scr.*,
            -- Source schedule details
            spd_src.schedule_per_day_date AS source_date,
            s_src.schedule_start_time AS source_start_time,
            s_src.schedule_end_time AS source_end_time,
            r_src.room_name AS source_room,
            i_src.instructor_name AS source_instructor_name,

            -- Target schedule details
            spd_tgt.schedule_per_day_date AS target_date,
            s_tgt.schedule_start_time AS target_start_time,
            s_tgt.schedule_end_time AS target_end_time,
            r_tgt.room_name AS target_room,
            i_tgt.instructor_name AS target_instructor_name

        FROM schedule_change_requests scr
        -- Source joins (INNER JOIN since source always exists)
        JOIN schedule_per_day spd_src ON scr.source_schedule_per_day_id = spd_src.schedule_per_day_id
        JOIN schedule s_src ON spd_src.schedule_id = s_src.schedule_id
        JOIN room r_src ON s_src.room_id = r_src.room_id
        JOIN instructor i_src ON scr.source_instructor_id = i_src.instructor_id

        -- Target joins (LEFT JOIN because target_schedule_per_day_id can be NULL)
        LEFT JOIN schedule_per_day spd_tgt ON scr.target_schedule_per_day_id = spd_tgt.schedule_per_day_id
        LEFT JOIN schedule s_tgt ON spd_tgt.schedule_id = s_tgt.schedule_id
        LEFT JOIN room r_tgt ON s_tgt.room_id = r_tgt.room_id
        LEFT JOIN instructor i_tgt ON scr.target_instructor_id = i_tgt.instructor_id

        WHERE (scr.request_type IN ('swap', 'give') AND scr.source_instructor_id = ?)
            OR (scr.request_type = 'request' AND scr.target_instructor_id = ?)
        ORDER BY scr.created_at DESC
        `, [instructorId, instructorId]);
        
        return rows;
    }

    async findReceivedRequests(instructorId) {
        const [rows] = await pool.query(`
        SELECT scr.*,
            -- Source schedule details
            spd_src.schedule_per_day_date AS source_date,
            s_src.schedule_start_time AS source_start_time,
            s_src.schedule_end_time AS source_end_time,
            r_src.room_name AS source_room,
            i_src.instructor_name AS source_instructor_name,

            -- Target schedule details
            spd_tgt.schedule_per_day_date AS target_date,
            s_tgt.schedule_start_time AS target_start_time,
            s_tgt.schedule_end_time AS target_end_time,
            r_tgt.room_name AS target_room,
            i_tgt.instructor_name AS target_instructor_name

        FROM schedule_change_requests scr
        -- Source joins (INNER JOIN since source always exists)
        JOIN schedule_per_day spd_src ON scr.source_schedule_per_day_id = spd_src.schedule_per_day_id
        JOIN schedule s_src ON spd_src.schedule_id = s_src.schedule_id
        JOIN room r_src ON s_src.room_id = r_src.room_id
        JOIN instructor i_src ON scr.source_instructor_id = i_src.instructor_id

        -- Target joins (LEFT JOIN because target_schedule_per_day_id can be NULL)
        LEFT JOIN schedule_per_day spd_tgt ON scr.target_schedule_per_day_id = spd_tgt.schedule_per_day_id
        LEFT JOIN schedule s_tgt ON spd_tgt.schedule_id = s_tgt.schedule_id
        LEFT JOIN room r_tgt ON s_tgt.room_id = r_tgt.room_id
        LEFT JOIN instructor i_tgt ON scr.target_instructor_id = i_tgt.instructor_id

        WHERE (scr.request_type IN ('swap', 'give') AND scr.target_instructor_id = ?)
            OR (scr.request_type = 'request' AND scr.source_instructor_id = ?)
        ORDER BY scr.created_at DESC
        `, [instructorId, instructorId]);

        return rows;
    }
}

module.exports = new ScheduleChangeRepository();