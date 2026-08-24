const scheduleRepository = require("../repositories/scheduleRepository");
const notificationRepository = require('../repositories/notificationRepository');
const roomReservationRepository = require('../repositories/roomReservationRepository');

const INDEX_TO_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

class ScheduleService {
    toSec(t) {
        if (!t) return 0;
        const parts = String(t).split(":").map(Number);
        return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
    }

    dayNameToIndex(nameOrIndex) {
        if (nameOrIndex == null) return null;
        if (!isNaN(Number(nameOrIndex))) return Number(nameOrIndex);
        const key = String(nameOrIndex).trim().toLowerCase();
        const map = {
            sun: 0, sunday: 0, mon: 1, monday: 1, tue: 2, tuesday: 2,
            wed: 3, wednesday: 3, thu: 4, thursday: 4, fri: 5, friday: 5, sat: 6, saturday: 6,
        };
        if (map[key] !== undefined) return map[key];
        const short = key.slice(0, 3);
        return map[short] !== undefined ? map[short] : null;
    }

    addDays(date, days) {
        const d = new Date(date);
        d.setDate(d.getDate() + days);
        return d;
    }

    normalizeToMidnight(raw, useT00 = false) {
        if (!raw) return null;
        if (raw instanceof Date) {
            return new Date(raw.getFullYear(), raw.getMonth(), raw.getDate());
        }
        return new Date(`${raw}${useT00 ? 'T00:00:00' : 'T08:00:00'}`);
    }

    fTime(timeStr) {
        const [hour, minute] = timeStr.split(":");
        let h = parseInt(hour);
        const ampm = h >= 12 ? "PM" : "AM";
        h = h % 12 || 12;
        return `${h}:${minute} ${ampm}`;
    }

    formatDate(date) {
        if (!date) return '';
        const d = new Date(date);
        if (isNaN(d)) return date;
        return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(d);
    }

    async hasOverlap({ room_id, sem_id, schedule_start_time, schedule_end_time, days, excludeId = null }) {
        const rows = await scheduleRepository.fetchSchedulesForOverlap(room_id, sem_id, excludeId);
        for (let row of rows) {
            const existingDays = row.days ? row.days.split(",") : [];
            const existingIdx = existingDays.map(d => this.dayNameToIndex(d)).filter(x => x !== null);
            const conflictDay = days.some(d => this.existingIdxIncludes(existingIdx, d));

            if (conflictDay) {
                const startSec = this.toSec(schedule_start_time);
                const endSec = this.toSec(schedule_end_time);
                const existingStart = this.toSec(row.schedule_start_time);
                const existingEnd = this.toSec(row.schedule_end_time);

                if (startSec < existingEnd && endSec > existingStart) {
                    return true;
                }
            }
        }
        return false;
    }

    existingIdxIncludes(existingIdx, day) {
        const idx = this.dayNameToIndex(day);
        return existingIdx.includes(idx);
    }

    async createSchedule(data) {
        const { room_id, sem_id, subject_id, instructor_id, year_section_id, schedule_start_time, schedule_end_time, days } = data;

        // 1. Validate time range
        if (this.toSec(schedule_start_time) >= this.toSec(schedule_end_time)) {
            return { success: false, status: 400, message: `Invalid time range.` };
        }

        // 2. Check for schedule overlaps
        const overlap = await this.hasOverlap({ room_id, sem_id, schedule_start_time, schedule_end_time, days });
        if (overlap) {
            return { success: false, status: 400, message: `Time conflict with an existing class schedule.` };
        }

        const connection = await scheduleRepository.getConnection();
        try {
            const sem = await scheduleRepository.fetchSemesterById(connection, sem_id);
            if (!sem) return { success: false, status: 400, message: `Invalid semester id.` };

            if (sem.sem_active !== 1) return { success: false, status: 400, message: `Semester is not active.` };

            const semStart = this.normalizeToMidnight(sem.sem_start_date, true);
            const semEnd = this.normalizeToMidnight(sem.sem_end_date, true);
            if (!semStart || !semEnd || isNaN(semStart) || isNaN(semEnd)) {
                return { success: false, status: 400, message: `Semester dates is invalid.` };
            }

            // 3. Map selected days to their numeric index equivalents (0 = Sun, 1 = Mon, etc.)
            const desiredIndexes = new Set(days.map(d => this.dayNameToIndex(d)).filter(x => x !== null));
            let occurrences = [];

            // 4. Generate daily occurrences within the semester range
            let curr = new Date(semStart);
            while (curr <= semEnd) {
                const dayIndex = curr.getDay();
                if (desiredIndexes.has(dayIndex)) {
                    const dateStr = curr.toISOString().split("T")[0];
                    const dayName = INDEX_TO_SHORT[dayIndex];
                    occurrences.push([null, dateStr, dayName]);
                }
                curr.setDate(curr.getDate() + 1);
            }

            await connection.beginTransaction();

            const finalInstructorId = instructor_id || 1;
            const scheduleId = await scheduleRepository.insertSchedule(connection, {
                sem_id, room_id, subject_id, instructor_id: finalInstructorId, year_section_id, schedule_start_time, schedule_end_time
            });

            let finalOccurrences = [];
            if (occurrences.length > 0) {
                finalOccurrences = occurrences.map(occ => [scheduleId, occ[1], occ[2]]);
                await scheduleRepository.insertScheduleDays(connection, finalOccurrences);
            }

            await connection.commit();

            return { 
                success: true, 
                status: 201, 
                message: "Schedule created successfully.",
                schedule_id: scheduleId, 
                occurrences_count: finalOccurrences.length 
            };

        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    }

    hasOverlap2(start1, end1, start2, end2) {
        return start1 < end2 && end1 > start2;
    }

    async createSingleDateSchedule(data) {
        const { room_id, date, start_time, end_time } = data;

        if (!date) {
            return { success: false, status: 400, message: "Date is required." };
        }

        const startSec = this.toSec(start_time);
        const endSec = this.toSec(end_time);

        const classSchedules = await scheduleRepository.findClassSchedulesByRoomAndDate(room_id, date);
        for (let sched of classSchedules) {
            const existingStart = this.toSec(sched.schedule_start_time);
            const existingEnd = this.toSec(sched.schedule_end_time);

            if (this.hasOverlap2(startSec, endSec, existingStart, existingEnd)) {
                return { 
                    success: false, 
                    status: 400, 
                    message: `Time conflict with an existing class schedule (${sched.schedule_start_time} - ${sched.schedule_end_time}).` 
                };
            }
        }

        const parsedDate = new Date(date);
        if (isNaN(parsedDate)) {
            return { success: false, status: 400, message: "Provided date format string is invalid." };
        }
        
        const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayEnum = dayLabels[parsedDate.getDay()];

        const scheduleId = await scheduleRepository.insertSingleDateSchedule(data, date, dayEnum);

        return { 
            success: true, 
            status: 201, 
            message: "Single date schedule created successfully.", 
            schedule_id: scheduleId 
        };
    }

    async getScheduleByRoom(roomId) {
        const rows = await scheduleRepository.fetchSchedulesByRoom(roomId);
        return rows.map((row) => ({
            schedule_id: row.schedule_id,
            subject_id: row.subject_id,
            subject: row.subject_code,
            instructor_id: row.instructor_id,
            instructor: row.instructor_name,
            year_section_id: row.year_section_id,
            year_section: row.year_section_name,
            schedule_start_time: row.schedule_start_time,
            schedule_end_time: row.schedule_end_time,
            days: row.days ? Array.from(new Set(row.days.split(","))) : [],
        }));
    }

    async getRoomTimetable(roomId, weekStart, weekEnd) {
        const semester = await scheduleRepository.fetchActiveSemester();
        if (!semester) return { success: false, status: 400, message: `No active semester.`};

        const start = weekStart || semester.sem_start_date;
        const end = weekEnd || this.addDays(new Date(start), 6).toISOString().split("T")[0];

        const fixedRows = await scheduleRepository.fetchTimetableSchedules(roomId, semester.sem_id, start, end);

        const allEvents = [
            ...fixedRows.map((row) => ({
                id: `${row.schedule_per_day_id}`,
                subject_id: row.subject_id,
                subject_code: `${row.subject_code}`,
                instructor_id: row.instructor_id,
                instructor: row.instructor_name,
                year_section_id: row.year_section_id,
                year_section: row.year_section_name,
                start_time: row.schedule_start_time,
                end_time: row.schedule_end_time,
                schedule_date: row.schedule_per_day_date,
                day_of_week: row.schedule_per_day_day,
                type: "Schedule",
            })),
        ];

        const grouped = {};
        allEvents.forEach((row) => {
            if (!grouped[row.day_of_week]) grouped[row.day_of_week] = [];
            grouped[row.day_of_week].push(row);
        });

        return {
            semester: { id: semester.sem_id, semester: semester.sem_semester, school_year: semester.sem_school_year },
            week_range: { start, end },
            timetable: grouped,
        };
    }

    async getAllSchedules() {
        const semester = await scheduleRepository.fetchActiveSemester();
        if (!semester) return { success: false, status: 400, message: `No active semester.`};

        const row = await scheduleRepository.fetchAllSchedules(semester.sem_id);
        return row;
    }

    async updateSchedule(id, data) {
        const { room_id, sem_id, subject_id, instructor_id, year_section_id, schedule_start_time, schedule_end_time, days } = data;

        if (this.toSec(schedule_start_time) >= this.toSec(schedule_end_time)) {
            return { success: false, status: 400, message: `Invalid time range.` };
        }

        const overlap = await this.hasOverlap({ room_id, sem_id, schedule_start_time, schedule_end_time, days, excludeId: id });
        if (overlap) {
            return { success: false, status: 400, message: `Schedule overlap.` };
        }

        const connection = await scheduleRepository.getConnection();
        try {
            const sem = await scheduleRepository.fetchSemesterById(connection, sem_id);
            if (!sem) return { success: false, status: 400, message: `Invalid semester id.` };

            const semStart = this.normalizeToMidnight(sem.sem_start_date, true);
            const semEnd = this.normalizeToMidnight(sem.sem_end_date, true);
            if (!semStart || !semEnd || isNaN(semStart) || isNaN(semEnd)) {
                return { success: false, status: 400, message: `Semester dates is invalid.` };
            }

            const desiredIndexes = new Set(days.map(d => this.dayNameToIndex(d)).filter(x => x !== null));
            let occurrences = [];

            let curr = new Date(semStart);
            while (curr <= semEnd) {
                const dayIndex = curr.getDay();
                if (desiredIndexes.has(dayIndex)) {
                    const dateStr = curr.toISOString().split("T")[0];
                    const dayName = INDEX_TO_SHORT[dayIndex];
                    occurrences.push([id, dateStr, dayName]);
                }
                curr.setDate(curr.getDate() + 1);
            }

            await connection.beginTransaction();
            
            await scheduleRepository.updateSchedule(connection, id, { 
                room_id, 
                subject_id, 
                instructor_id: instructor_id || 1, 
                year_section_id, 
                schedule_start_time, 
                schedule_end_time 
            });
            
            await scheduleRepository.deleteScheduleDays(connection, id);

            if (occurrences.length > 0) {
                await scheduleRepository.insertScheduleDays(connection, occurrences);
            }

            await connection.commit();

            return { 
                success: true, 
                status: 200, 
                message: "Schedule updated successfully.",
                occurrences_count: occurrences.length 
            };
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    }

    async deleteSchedules(idsString) {
        if (!idsString) return { success: false, status: 400, message: `No id provided.`};
        const idList = idsString.split(",");
        await scheduleRepository.bulkDeleteSchedules(idList);
    }

    async deleteSpecificOccurrence(id, logMeta) {
        const row = await scheduleRepository.fetchOccurrenceDetails(id);
        if (!row) return { success: false, status: 400, message: `Occurence not found.`};

        await scheduleRepository.deleteSpecificOccurrence(id);

        const { currentUserRole, currentUserName, instructorId, instructorName, roomName, reservationDate, startTime, endTime } = logMeta;

        if(currentUserRole === 'admin') {
            const logText = `${currentUserName} (admin) removed the schedule of ${instructorName} at ${roomName} on ${this.formatDate(reservationDate)} (${this.fTime(startTime)} - ${this.fTime(endTime)}).`;
            await roomReservationRepository.insertRoomReservationLog("removed", logText, instructorId);
        } else {
            const logText = `${instructorName} removed his/her schedule at ${roomName} on ${this.formatDate(reservationDate)} (${this.fTime(startTime)} - ${this.fTime(endTime)}).`;
            await roomReservationRepository.insertRoomReservationLog("removed", logText, instructorId);
        }

        if(currentUserRole === 'admin') {
            const instructorNotificationText = `${currentUserName} (admin) removed your schedule at ${roomName} on ${this.formatDate(reservationDate)} (${this.fTime(startTime)} - ${this.fTime(endTime)}).`;
            const allInstructorNotificationText = `${currentUserName} (admin) removed schedule of ${instructorName} at ${roomName} on ${this.formatDate(reservationDate)} (${this.fTime(startTime)} - ${this.fTime(endTime)}).`;
            await notificationRepository.createNotification("Removed Schedule", allInstructorNotificationText, "removed", "all_instructors", null, null, instructorId, 'instructor');
            await notificationRepository.createNotification("Removed Schedule", instructorNotificationText, "removed", "specific_user", instructorId, 'instructor');
        } else {
            const instructorNotificationText = `You removed your schedule at ${roomName} on ${this.formatDate(reservationDate)} (${this.fTime(startTime)} - ${this.fTime(endTime)}).`;
            const allInstructorNotificationText = `${instructorName} removed his/her schedule at ${roomName} on ${this.formatDate(reservationDate)} (${this.fTime(startTime)} - ${this.fTime(endTime)}).`;
            await notificationRepository.createNotification("Removed Schedule", allInstructorNotificationText, "removed", "all_instructors", null, null, instructorId, 'instructor');
            await notificationRepository.createNotification("Removed Schedule", instructorNotificationText, "removed", "specific_user", instructorId, 'instructor');
        }
    }
}

module.exports = new ScheduleService();