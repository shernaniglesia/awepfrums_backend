const roomReservationRepository = require('../repositories/roomReservationRepository');
const notificationRepository = require('../repositories/notificationRepository');

class RoomReservationService {
    fTime(timeStr) {
        if (!timeStr) return '';
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
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Intl.DateTimeFormat('en-US', options).format(d);
    }

    toSec(t) {
        if (!t) return 0;
        const parts = String(t).split(":").map(Number);
        return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
    }

    hasOverlap(start1, end1, start2, end2) {
        return start1 < end2 && start2 < end1;
    }

    async createRoomReservationLog(type, text, iid) {
        await roomReservationRepository.insertRoomReservationLog(type, text, iid);
    }

    async createNotification(title, message, target_type, target_user_id, target_user_role, exclude_user_id, exclude_user_role) {
        await notificationRepository.createNotification(title, message, target_type, target_user_id, target_user_role, exclude_user_id, exclude_user_role);
    }

    async getAllRoomReservations() {
        return await roomReservationRepository.findAllRoomReservations();
    }

    async getAllUserRoomReservations(instructorId) {
        return await roomReservationRepository.findAllUserRoomReservations(instructorId);
    }

    async createRoomReservation(data) {
        const { room_id, room_name, user_id, user_name, date, start_time, end_time } = data;
        const startSec = this.toSec(start_time);
        const endSec = this.toSec(end_time);

        // Verify conflict against standing class schedules
        const classSchedules = await roomReservationRepository.findClassSchedulesByRoomAndDate(room_id, date);
        for (let sched of classSchedules) {
            const existingStart = this.toSec(sched.schedule_start_time);
            const existingEnd = this.toSec(sched.schedule_end_time);
            if (this.hasOverlap(startSec, endSec, existingStart, existingEnd)) {
                return { 
                success: false, 
                status: 400, 
                message: `Time conflict with an existing class schedule (${sched.schedule_start_time} - ${sched.schedule_end_time}).` 
                };
            }
        }

        await roomReservationRepository.insertRoomReservation(data);

        const logText = `${user_name} submit a request to reserve the ${room_name} on ${this.formatDate(date)} (${this.fTime(start_time)} - ${this.fTime(end_time)}).`;
        const instructorNotificationText = `You submit reservation request for ${room_name} on ${this.formatDate(date)} (${this.fTime(start_time)} - ${this.fTime(end_time)}).`;

        await this.createRoomReservationLog("reserved", logText, user_id);
        await this.createNotification("New Reservation", instructorNotificationText, "specific_user", user_id, 'instructor');
        await this.createNotification("New Reservation", logText, "all_admins");
        
        return {success: true,status: 201,};
    }

    async approveRoomReservation(id, meta) {
        const { adminName, instructorId, instructorName, roomName, reservationDate, startTime, endTime } = meta;
        const reservation = await roomReservationRepository.findRoomReservationById(id);
        if (!reservation) return { success: false, status: 400, message: "Reservation not found." };

        const startSec = this.toSec(startTime);
        const endSec = this.toSec(endTime);

        const classSchedules = await roomReservationRepository.findClassSchedulesByRoomAndDate(reservation.room_id, reservation.room_reservation_date);
        for (let sched of classSchedules) {
            const existingStart = this.toSec(sched.schedule_start_time);
            const existingEnd = this.toSec(sched.schedule_end_time);
            if (this.hasOverlap(startSec, endSec, existingStart, existingEnd)) {
                return { 
                success: false, 
                status: 400, 
                message: `Time conflict with an existing class schedule (${sched.schedule_start_time} - ${sched.schedule_end_time}).` 
                };
            }
        }

        const parsedDate = new Date(reservationDate);
        if (isNaN(parsedDate)) {
            return { success: false, status: 400, message: "Provided date format string is invalid." };
        }
        
        const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayEnum = dayLabels[parsedDate.getDay()];

        const scheduleId = await roomReservationRepository.insertSingleDateSchedule(reservation, reservationDate, dayEnum);
    
        await roomReservationRepository.updateRoomReservationStatus(id, 'approved');

        const logText = `${adminName} (admin) approved the request of ${instructorName} to reserve the ${roomName} on ${this.formatDate(reservationDate)} (${this.fTime(startTime)} - ${this.fTime(endTime)}).`;
        const instructorNotificationText = `Your request to reserve the ${roomName} on ${this.formatDate(reservationDate)} (${this.fTime(startTime)} - ${this.fTime(endTime)}) has been approved.`;
    
        await this.createRoomReservationLog("approved", logText, instructorId);
        await this.createNotification("Request Approved", instructorNotificationText, "specific_user", instructorId, 'instructor');
        
        return {success: true,status: 200,};
    }

    async declineRoomReservation(id, meta) {
        const { adminName, instructorId, instructorName, roomName, reservationDate, startTime, endTime } = meta;
        const wasUpdated = await roomReservationRepository.updateRoomReservationStatus(id, 'rejected');
        if (!wasUpdated) return { success: false, status: 400, message: "Reservation not found." };

        const logText = `${adminName} (admin) declined the request of ${instructorName} to reserve the ${roomName} on ${this.formatDate(reservationDate)} (${this.fTime(startTime)} - ${this.fTime(endTime)}).`;
        const instructorNotificationText = `Your request to reserve the ${roomName} on ${this.formatDate(reservationDate)} (${this.fTime(startTime)} - ${this.fTime(endTime)}) has been declined.`;
    
        await this.createRoomReservationLog("declined", logText, instructorId);
        await this.createNotification("Request Declined", instructorNotificationText, "specific_user", instructorId, 'instructor');
    }

    async cancelRoomReservation(id, meta) {
        const { instructorId, instructorName, roomName, reservationDate, startTime, endTime } = meta;
        const wasUpdated = await roomReservationRepository.updateRoomReservationStatus(id, 'cancelled');
        if (!wasUpdated) return { success: false, status: 400, message: "Reservation not found." };

        const logText = `${instructorName} cancelled his/her request to reserve the ${roomName} on ${this.formatDate(reservationDate)} (${this.fTime(startTime)} - ${this.fTime(endTime)}).`;
        const instructorNotificationText = `You cancelled your request to reserve the ${roomName} on ${this.formatDate(reservationDate)} (${this.fTime(startTime)} - ${this.fTime(endTime)}).`;
    
        await this.createRoomReservationLog("cancelled", logText, instructorId);
        await this.createNotification("Request Cancelled", instructorNotificationText, "specific_user", instructorId, 'instructor');
    }

    // async removeRoomReservation(id, meta) {
    //     const { currentUserRole, currentUserName, instructorId, instructorName, roomName, reservationDate, startTime, endTime } = meta;
    //     const wasUpdated = await roomReservationRepository.updateRoomReservationStatus(id, 'removed');
    //     if (!wasUpdated) return { success: false, status: 400, message: "Reservation not found." };

    //     const identityActionMessage = currentUserRole === 'admin' 
    //     ? `${currentUserName} (admin) removed the schedule of ${instructorName} at ${roomName}`
    //     : `${instructorName} removed his/her schedule at ${roomName}`;

    //     const logText = `${identityActionMessage} on ${this.formatDate(reservationDate)} (${this.fTime(startTime)} - ${this.fTime(endTime)}).`;
    //     await this.createRoomReservationLog("removed", logText, instructorId);

    //     if(currentUserRole === 'admin') {
    //         const instructorNotificationText = `${currentUserName} (admin) removed your schedule at ${roomName} on ${this.formatDate(reservationDate)} (${this.fTime(startTime)} - ${this.fTime(endTime)}).`;
    //         const allInstructorNotificationText = `${currentUserName} (admin) removed schedule of ${instructorName} at ${roomName} on ${this.formatDate(reservationDate)} (${this.fTime(startTime)} - ${this.fTime(endTime)}).`;
    //         await this.createNotification("Removed Schedule", allInstructorNotificationText, "all_instructors", null, null, instructorId, 'instructor');
    //         await this.createNotification("Removed Schedule", instructorNotificationText, "specific_user", instructorId, 'instructor');
    //     } else {
    //         const instructorNotificationText = `You removed your schedule at ${roomName} on ${this.formatDate(reservationDate)} (${this.fTime(startTime)} - ${this.fTime(endTime)}).`;
    //         const allInstructorNotificationText = `${instructorName} removed his/her schedule at ${roomName} on ${this.formatDate(reservationDate)} (${this.fTime(startTime)} - ${this.fTime(endTime)}).`;
    //         await this.createNotification("Removed Schedule", allInstructorNotificationText, "all_instructors", null, null, instructorId, 'instructor');
    //         await this.createNotification("Removed Schedule", instructorNotificationText, "specific_user", instructorId, 'instructor');
    //     }
    // }

    async getAllRoomReservationLogs() {
        return await roomReservationRepository.findAllRoomReservationLogs();
    }

    async getAllUserRoomReservationLogs(instructorId) {
        return await roomReservationRepository.findAllUserRoomReservationLogs(instructorId);
    }
}

module.exports = new RoomReservationService();