const changeRepository = require("../repositories/scheduleChangeRepository");
const roomReservationRepository = require('../repositories/roomReservationRepository');
const notificationRepository = require('../repositories/notificationRepository');

class ScheduleChangeService {
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

    async createRoomReservationLog(type, text, iid) {
        await roomReservationRepository.insertRoomReservationLog(type, text, iid);
    }
    
    async createNotification(title, message, target_type, target_user_id, target_user_role, exclude_user_id, exclude_user_role) {
        await notificationRepository.createNotification(title, message, target_type, target_user_id, target_user_role, exclude_user_id, exclude_user_role);
    }


    async submitChangeRequest(data) {
        const { type, sourceSchedPerDayId, sourceInstId, sourceName,
            targetSchedPerDayId, targetInstId, targetName,
            targetSubjectId, targetYearSectionId, 
            sourceSubjectId, sourceYearSectionId, 
            sourceRoomName, sourceDate, sourceStartTime, sourceEndTime,
            targetRoomName, targetDate, targetStartTime, targetEndTime, } = data;
    
        if (type === 'swap' && !targetSchedPerDayId) {
            return { success: false, status: 400, message: "Target schedule item parameter is required for trade swaps." };
        }
    
        const requestId = await changeRepository.createRequest(data);
    
        if(type === "give") {
            const logText = `${sourceName} submit a request to give the schedule in ${targetRoomName} on ${this.formatDate(targetDate)} (${this.fTime(targetStartTime)} - ${this.fTime(targetEndTime)}) to ${targetName}.`;
            const instructorNotificationText = `${sourceName} want to give you a schedule  on ${this.formatDate(targetDate)} in ${targetRoomName} (${this.fTime(targetStartTime)} - ${this.fTime(targetEndTime)}).`;
            
            await this.createRoomReservationLog("reserved", logText, sourceInstId);
            await this.createRoomReservationLog("reserved", logText, targetInstId);
            await this.createNotification("Give Schedule", instructorNotificationText, "specific_user", targetInstId, 'instructor');
        }
    
        if(type === "request") {
            const logText = `${targetName} submit a request to get the schedule of ${sourceName} in ${sourceRoomName} on ${this.formatDate(sourceDate)} (${this.fTime(sourceStartTime)} - ${this.fTime(sourceEndTime)}).`;
            const instructorNotificationText = `${targetName} requesting to get your schedule on ${this.formatDate(sourceDate)} in ${sourceRoomName} (${this.fTime(sourceStartTime)} - ${this.fTime(sourceEndTime)}).`;
            
            await this.createRoomReservationLog("reserved", logText, sourceInstId);
            await this.createRoomReservationLog("reserved", logText, targetInstId);
            await this.createNotification("Get Schedule", instructorNotificationText, "specific_user", sourceInstId, 'instructor');
        }
    
        if(type === "swap") {
            const logText = `${sourceName} create a request to swap his/her schedule  on ${this.formatDate(sourceDate)} in ${sourceRoomName} (${this.fTime(sourceStartTime)} - ${this.fTime(sourceEndTime)}) 
            to schedule of ${targetName} on ${this.formatDate(targetDate)} in ${targetRoomName} (${this.fTime(targetStartTime)} - ${this.fTime(targetEndTime)}) .`;
            const instructorNotificationText = `${sourceName} want to swap his/her schedule  on ${this.formatDate(sourceDate)} in ${sourceRoomName} (${this.fTime(sourceStartTime)} - ${this.fTime(sourceEndTime)}) 
            to your schedule on ${this.formatDate(targetDate)} in ${targetRoomName} (${this.fTime(targetStartTime)} - ${this.fTime(targetEndTime)}) .`;

            await this.createRoomReservationLog("reserved", logText, sourceInstId);
            await this.createRoomReservationLog("reserved", logText, targetInstId);
            await this.createNotification("Swap Schedule", instructorNotificationText, "specific_user", targetInstId, 'instructor');
        }
    
        return { success: true, status: 201, message: `Schedule ${type} request filed successfully.`, request_id: requestId };
    }


    async processRequestAction(requestId, actorInstructorId, action, subjectId, yearSectionId, 
        sourceName, sourceRoomName, sourceDate, sourceStartTime, sourceEndTime, 
        targetName, targetRoomName, targetDate, targetStartTime, targetEndTime,) {
        const request = await changeRepository.findRequestById(requestId);

        if (!request) {
            return { success: false, status: 404, message: "Schedule change request record not found." };
        }

        if (request.status !== 'pending') {
            return { success: false, status: 400, message: "This request has already been processed." };
        }
    
        if(action === 'cancelled') {
            await changeRepository.updateRequestStatus(requestId, 'cancelled');

            if(request.request_type === "give") {
                const logText = `${sourceName} decided not to give the schedule to ${targetName} in ${sourceRoomName} on 
                ${this.formatDate(sourceDate)} (${this.fTime(sourceStartTime)} - ${this.fTime(sourceEndTime)}).`;
                const instructorNotificationText = `${sourceName} decided not to give you the schedule  on ${this.formatDate(sourceDate)} 
                in ${sourceRoomName} (${this.fTime(sourceStartTime)} - ${this.fTime(sourceEndTime)}).`;

                await this.createRoomReservationLog("reserved", logText, request.source_instructor_id);
                await this.createRoomReservationLog("reserved", logText, request.target_instructor_id);
                await this.createNotification("Cancelled Give Schedule", instructorNotificationText, "specific_user", request.target_instructor_id, 'instructor');
            }

            if(request.request_type === "request") {
                const logText = `${targetName} cancelled the request to get the schedule of ${sourceName} in ${sourceRoomName} on 
                ${this.formatDate(sourceDate)} (${this.fTime(sourceStartTime)} - ${this.fTime(sourceEndTime)}).`;
                const instructorNotificationText = `${targetName} cancelled the request to get your schedule on ${this.formatDate(sourceDate)} in 
                ${sourceRoomName} (${this.fTime(sourceStartTime)} - ${this.fTime(sourceEndTime)}).`;

                await this.createRoomReservationLog("reserved", logText, request.source_instructor_id);
                await this.createRoomReservationLog("reserved", logText, request.target_instructor_id);
                await this.createNotification("Cancelled Get Schedule", instructorNotificationText, "specific_user", request.source_instructor_id, 'instructor');
            }

            if(request.request_type === "swap") {
                const logText = `${sourceName} cancelled the request to swap his/her schedule  on ${this.formatDate(sourceDate)} in ${sourceRoomName} (${this.fTime(sourceStartTime)} - ${this.fTime(sourceEndTime)}) 
                to schedule of ${targetName} on ${this.formatDate(targetDate)} in ${targetRoomName} (${this.fTime(targetStartTime)} - ${this.fTime(targetEndTime)}) .`;
                const instructorNotificationText = `${sourceName} cancelled the swap request of his/her schedule on ${this.formatDate(sourceDate)} in ${sourceRoomName} (${this.fTime(sourceStartTime)} - ${this.fTime(sourceEndTime)}) 
                to your schedule on ${this.formatDate(targetDate)} in ${targetRoomName} (${this.fTime(targetStartTime)} - ${this.fTime(targetEndTime)}) .`;

                await this.createRoomReservationLog("reserved", logText, request.source_instructor_id);
                await this.createRoomReservationLog("reserved", logText, request.target_instructor_id);
                await this.createNotification("Cancelled Swap Schedule", instructorNotificationText, "specific_user", request.target_instructor_id, 'instructor');
            }

            return { success: true, status: 200, message: "Schedule request successfully cancelled." };
        }
        
        // Determine who has the authority to accept/reject based on request type
        // 'give' and 'swap' are approved by the target instructor; 'request' is approved by the owner (source)
        const requiredApprover = (request.request_type === 'request') ? request.source_instructor_id : request.target_instructor_id;
    
        if (parseInt(actorInstructorId) !== requiredApprover) {
            return { success: false, status: 403, message: "You are not authorized to respond to this schedule alteration request." };
        }
        
        if (action === 'approved') {
            await changeRepository.executeScheduleOwnershipSwap(request, subjectId, yearSectionId);
            await changeRepository.updateRequestStatus(requestId, 'approved');

            if(request.request_type === "give") {
                const logText = `${targetName} claimed the schedule gave by ${sourceName} in ${sourceRoomName} on 
                ${this.formatDate(sourceDate)} (${this.fTime(sourceStartTime)} - ${this.fTime(sourceEndTime)}).`;
                const instructorNotificationText = `${targetName} claimed the schedule you gave on ${this.formatDate(sourceDate)} 
                in ${sourceRoomName} (${this.fTime(sourceStartTime)} - ${this.fTime(sourceEndTime)}).`;
                
                await this.createRoomReservationLog("reserved", logText, request.source_instructor_id);
                await this.createRoomReservationLog("reserved", logText, request.target_instructor_id);
                await this.createNotification("Claimed Give Schedule", instructorNotificationText, "specific_user", request.source_instructor_id, 'instructor');
            }

            if(request.request_type === "request") {
                const logText = `${sourceName} approved the request of ${targetName} to get the schedule in ${sourceRoomName} on 
                ${this.formatDate(sourceDate)} (${this.fTime(sourceStartTime)} - ${this.fTime(sourceEndTime)}).`;
                const instructorNotificationText = `${sourceName} approved your request to get the schedule on ${this.formatDate(sourceDate)} 
                in ${sourceRoomName} (${this.fTime(sourceStartTime)} - ${this.fTime(sourceEndTime)}).`;

                await this.createRoomReservationLog("reserved", logText, request.source_instructor_id);
                await this.createRoomReservationLog("reserved", logText, request.target_instructor_id);
                await this.createNotification("Approved Get Schedule", instructorNotificationText, "specific_user", request.target_instructor_id, 'instructor');
            }

            if(request.request_type === "swap") {
                const logText = `${targetName} approved the request to swap his/her schedule  on ${this.formatDate(targetDate)} in ${targetRoomName} (${this.fTime(targetStartTime)} - ${this.fTime(targetEndTime)}) 
                to schedule of ${sourceName} on ${this.formatDate(sourceDate)} in ${sourceRoomName} (${this.fTime(sourceStartTime)} - ${this.fTime(sourceEndTime)}) .`;
                const instructorNotificationText = `${targetName} approved the swap request of his/her schedule on ${this.formatDate(targetDate)} in ${targetRoomName} (${this.fTime(targetStartTime)} - ${this.fTime(targetEndTime)}) 
                to your schedule on ${this.formatDate(sourceDate)} in ${sourceRoomName} (${this.fTime(sourceStartTime)} - ${this.fTime(sourceEndTime)}) .`;
               
                await this.createRoomReservationLog("reserved", logText, request.source_instructor_id);
                await this.createRoomReservationLog("reserved", logText, request.target_instructor_id);
                await this.createNotification("Approved Swap Schedule", instructorNotificationText, "specific_user", request.source_instructor_id, 'instructor');
            }

            return { success: true, status: 200, message: "Schedule modification successfully executed." };
        } 
        
        if(action === 'declined') {
            await changeRepository.updateRequestStatus(requestId, 'declined');

            if(request.request_type === "give") {
                const logText = `${targetName} declined the schedule that want to give by ${sourceName} in ${sourceRoomName} on 
                ${this.formatDate(sourceDate)} (${this.fTime(sourceStartTime)} - ${this.fTime(sourceEndTime)}).`;
                const instructorNotificationText = `${targetName} decided not to claim the schedule that you give, with date ${this.formatDate(sourceDate)} 
                in ${sourceRoomName} (${this.fTime(sourceStartTime)} - ${this.fTime(sourceEndTime)}).`;

                await this.createRoomReservationLog("reserved", logText, request.source_instructor_id);
                await this.createRoomReservationLog("reserved", logText, request.target_instructor_id);
                await this.createNotification("Declined Give Schedule", instructorNotificationText, "specific_user", request.source_instructor_id, 'instructor');
            }

            if(request.request_type === "request") {
                const logText = `${sourceName} declined the request of ${targetName} to get the schedule in ${sourceRoomName} on 
                ${this.formatDate(sourceDate)} (${this.fTime(sourceStartTime)} - ${this.fTime(sourceEndTime)}).`;
                const instructorNotificationText = `${sourceName} declined your request to get the schedule on ${this.formatDate(sourceDate)} 
                in ${sourceRoomName} (${this.fTime(sourceStartTime)} - ${this.fTime(sourceEndTime)}).`;

                await this.createRoomReservationLog("reserved", logText, request.source_instructor_id);
                await this.createRoomReservationLog("reserved", logText, request.target_instructor_id);
                await this.createNotification("Declined Get Schedule", instructorNotificationText, "specific_user", request.target_instructor_id, 'instructor');
            }

            if(request.request_type === "swap") {
                const logText = `${targetName} declined the request to swap his/her schedule  on ${this.formatDate(targetDate)} in ${targetRoomName} (${this.fTime(targetStartTime)} - ${this.fTime(targetEndTime)}) 
                to schedule of ${sourceName} on ${this.formatDate(sourceDate)} in ${sourceRoomName} (${this.fTime(sourceStartTime)} - ${this.fTime(sourceEndTime)}) .`;
                const instructorNotificationText = `${targetName} declined the swap request of his/her schedule on ${this.formatDate(targetDate)} in ${targetRoomName} (${this.fTime(targetStartTime)} - ${this.fTime(targetEndTime)}) 
                to your schedule on ${this.formatDate(sourceDate)} in ${sourceRoomName} (${this.fTime(sourceStartTime)} - ${this.fTime(sourceEndTime)}) .`;
               
                await this.createRoomReservationLog("reserved", logText, request.source_instructor_id);
                await this.createRoomReservationLog("reserved", logText, request.target_instructor_id);
                await this.createNotification("Declined Swap Schedule", instructorNotificationText, "specific_user", request.source_instructor_id, 'instructor');
            }
            
            return { success: true, status: 200, message: "Schedule request successfully declined." };
        }
    }
    
    async getInstructorInbox(instructorId) {
        const [sent, received] = await Promise.all([
            changeRepository.findSentRequests(instructorId),
            changeRepository.findReceivedRequests(instructorId)
        ]);

        return { success: true, status: 200, data: { sent, received } };
    }
}

module.exports = new ScheduleChangeService();