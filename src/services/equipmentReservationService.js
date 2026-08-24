const equipmentReservationRepository = require("../repositories/equipmentReservationRepository");
const notificationRepository = require('../repositories/notificationRepository');

class EquipmentReservationService {
    hasOverlap(start1, end1, start2, end2) {
        return start1 < end2 && end1 > start2;
    }

    fTime(timeStr) {
        if (!timeStr) return '';
        const [hour, minute] = timeStr.split(":");
        let h = parseInt(hour);
        const ampm = h >= 12 ? "PM" : "AM";
        h = h % 12 || 12;
        return `${h}:${minute} ${ampm}`;
    }

    async createEquipmentReservationLog(type, text, role, id) {
        await equipmentReservationRepository.insertEquipmentReservationLog(type, text, role, id);
    }

    async createNotification(title, message, target_type, target_user_id, target_user_role, exclude_user_id, exclude_user_role) {
        await notificationRepository.createNotification(title, message, target_type, target_user_id, target_user_role, exclude_user_id, exclude_user_role);
    }

    async getEquipmentReservations() {
        return await equipmentReservationRepository.findAllEquipmentReservations();
    }

    async getUserEquipmentReservations(role, userId) {
        return await equipmentReservationRepository.findAllUserEquipmentReservations(role, userId);
    }

    async createEquipmentReservation(data) {
        const { 
        equipment_id, equipment_name, equipment_reservation_user_type, 
        equipment_reservation_reference_id, equipment_reservation_date, 
        equipment_reservation_start_time, equipment_reservation_end_time, current_user_name 
        } = data;

        const existing = await equipmentReservationRepository.findApprovedEquipmentReservationsByEquipmentAndDate(equipment_id, equipment_reservation_date);
        for (let r of existing) {
            if (this.hasOverlap(equipment_reservation_start_time, equipment_reservation_end_time, r.equipment_reservation_start_time, r.equipment_reservation_end_time)) {
                throw new Error(`CONFLICT_RESERVATION:${r.equipment_reservation_start_time}-${r.equipment_reservation_end_time}`);
            }
        }

        const insertId = await equipmentReservationRepository.insertEquipmentReservation(data);

        const logText = `${current_user_name} submitted a request to reserve the ${equipment_name} from (${this.fTime(equipment_reservation_start_time)} to ${this.fTime(equipment_reservation_end_time)}).`;
        const instructorNotificationText = `You create a reservation for ${equipment_name} (${this.fTime(equipment_reservation_start_time)} - ${this.fTime(equipment_reservation_end_time)}).`;
        const adminNotificationText = `${current_user_name} create a reservation for ${equipment_name} (${this.fTime(equipment_reservation_start_time)} - ${this.fTime(equipment_reservation_end_time)}).`;

        await this.createEquipmentReservationLog("reserved", logText, equipment_reservation_user_type, equipment_reservation_reference_id);
        await this.createNotification("Submit Request", instructorNotificationText, "specific_user", equipment_reservation_reference_id, equipment_reservation_user_type);
        await this.createNotification("Equipment Reservation Request", adminNotificationText, "all_admins");

        return insertId;
    }

    async approveEquipmentReservation(id, data) {
        const {  adminName, equipment_name, equipment_reservation_type,
            equipment_reservation_user_type, equipment_reservation_reference_id, 
            equipment_reservation_user_name, equipment_reservation_date, 
            equipment_reservation_start_time, equipment_reservation_end_time } = data

        const reservation = await equipmentReservationRepository.findEquipmentReservationById(id);
        if (!reservation) throw new Error("RESERVATION_NOT_FOUND");

        const conflicts = await equipmentReservationRepository.findApprovedEquipmentReservationsByEquipmentAndDate(reservation.equipment_id, equipment_reservation_date, id);
        for (let conflict of conflicts) {
            if (this.hasOverlap(equipment_reservation_start_time, equipment_reservation_end_time, conflict.equipment_reservation_start_time, conflict.equipment_reservation_end_time)) {
                throw new Error(`CONFLICT_APPROVAL:${conflict.equipment_reservation_start_time}-${conflict.equipment_reservation_end_time}`);
            }
        }

        await equipmentReservationRepository.updateEquipmentReservationStatus(id, 'approved');

        const logText = `${adminName} (admin) approved the reservation request of ${equipment_reservation_user_name} for ${equipment_name} (${this.fTime(equipment_reservation_start_time)} - ${this.fTime(equipment_reservation_end_time)}).`;
        const instructorNotificationText = `Your request to reserve the ${equipment_name} (${this.fTime(equipment_reservation_start_time)} - ${this.fTime(equipment_reservation_end_time)}) has been approved.`;
    
        await this.createEquipmentReservationLog("approved", logText, equipment_reservation_user_type, equipment_reservation_reference_id);
        await this.createNotification("Request Approved", instructorNotificationText, "specific_user", equipment_reservation_reference_id, equipment_reservation_user_type);
    }

    async declineEquipmentReservation(id, data) {
        const { adminName, equipment_name, equipment_reservation_type,
            equipment_reservation_user_type, equipment_reservation_reference_id, 
            equipment_reservation_user_name, equipment_reservation_date, 
            equipment_reservation_start_time, equipment_reservation_end_time } = data

        const wasUpdated = await equipmentReservationRepository.updateEquipmentReservationStatus(id, 'declined');
        if (!wasUpdated) throw new Error("RESERVATION_NOT_FOUND");

        const logText = `${adminName} (admin) declined the reservation request of ${equipment_reservation_user_name} for ${equipment_name} (${this.fTime(equipment_reservation_start_time)} - ${this.fTime(equipment_reservation_end_time)}).`;
        const instructorNotificationText = `Your request to reserve the ${equipment_name} (${this.fTime(equipment_reservation_start_time)} - ${this.fTime(equipment_reservation_end_time)}) has been declined.`;
    
        await this.createEquipmentReservationLog("declined", logText, equipment_reservation_user_type, equipment_reservation_reference_id);
        await this.createNotification("Request Declined", instructorNotificationText, "specific_user", equipment_reservation_reference_id, equipment_reservation_user_type);
    }

    async cancelEquipmentReservation(id, data) {
        const { equipment_reservation_user_name, equipment_name, equipment_reservation_start_time, equipment_reservation_end_time, 
                equipment_reservation_user_type, equipment_reservation_reference_id } = data;

        const reservation = await equipmentReservationRepository.findEquipmentReservationById(id);
        if (!reservation) throw new Error("RESERVATION_NOT_FOUND");

        await equipmentReservationRepository.updateEquipmentReservationStatus(id, 'cancelled');
        
        const logText = `${equipment_reservation_user_name} cancelled the request for ${equipment_name} (${this.fTime(equipment_reservation_start_time)} - ${this.fTime(equipment_reservation_end_time)}).`;
        const instructorNotificationText = `You cancelled the reservation for ${equipment_name} (${this.fTime(equipment_reservation_start_time)} - ${this.fTime(equipment_reservation_end_time)}).`;

        await this.createEquipmentReservationLog("cancelled", logText, equipment_reservation_user_type, equipment_reservation_reference_id);
        await this.createNotification("Request Cancelled", instructorNotificationText, "specific_user", equipment_reservation_reference_id, equipment_reservation_user_type);
    }

    async borrowEquipmentReservation(id, data) {
        const { adminName, equipment_name, equipment_reservation_type,
            equipment_reservation_user_type, equipment_reservation_reference_id, 
            equipment_reservation_user_name, equipment_reservation_date, 
            equipment_reservation_start_time, equipment_reservation_end_time } = data

        const reservation = await equipmentReservationRepository.findEquipmentReservationById(id);
        if (!reservation) throw new Error("RESERVATION_NOT_FOUND");

        const activeBorrows = await equipmentReservationRepository.findActiveBorrowsByEquipment(reservation.equipment_id);
        if (activeBorrows.length > 0) {
            const currentHolder = activeBorrows[0].borrower_name || "another user";
            throw new Error(`EQUIPMENT_HELD_BY:${currentHolder}`);
        }

        await equipmentReservationRepository.updateEquipmentReservationStatus(id, 'borrowed');

        const logText = `${adminName} (admin) mark the equipment ${equipment_name} as borrowed by ${equipment_reservation_user_name} (${this.fTime(equipment_reservation_start_time)} - ${this.fTime(equipment_reservation_end_time)}).`;
        const instructorNotificationText = `You borrowed the ${equipment_name} (${this.fTime(equipment_reservation_start_time)} - ${this.fTime(equipment_reservation_end_time)}).`;
    
        await this.createEquipmentReservationLog("borrowed", logText, equipment_reservation_user_type, equipment_reservation_reference_id);
        await this.createNotification("Equipment Borrrowed", instructorNotificationText, "specific_user", equipment_reservation_reference_id, equipment_reservation_user_type);
    }

    async returnEquipmentReservation(id, data) {
        const { adminName, equipment_name, equipment_reservation_type,
            equipment_reservation_user_type, equipment_reservation_reference_id, 
            equipment_reservation_user_name, equipment_reservation_date, 
            equipment_reservation_start_time, equipment_reservation_end_time } = data

        const wasUpdated = await equipmentReservationRepository.updateEquipmentReservationStatus(id, 'returned');
        if (!wasUpdated) throw new Error("RESERVATION_NOT_FOUND");
        
        const logText = `${adminName} (admin) mark the equipment ${equipment_name} as returned by ${equipment_reservation_user_name} (${this.fTime(equipment_reservation_start_time)} - ${this.fTime(equipment_reservation_end_time)}).`;
        const instructorNotificationText = `You returned the ${equipment_name} (${this.fTime(equipment_reservation_start_time)} - ${this.fTime(equipment_reservation_end_time)}).`;
    
        await this.createEquipmentReservationLog("returned", logText, equipment_reservation_user_type, equipment_reservation_reference_id);
        await this.createNotification("Equipment Returned", instructorNotificationText, "specific_user", equipment_reservation_reference_id, equipment_reservation_user_type);
    }

    async getAllEquipmentReservationLogs() {
        return await equipmentReservationRepository.findAllEquipmentReservationLogs();
    }

    async getAllUserEquipmentReservationLogs(role, userId) {
        return await equipmentReservationRepository.findAllUserEquipmentReservationLogs(role, userId);
    }

    async getAllEquipmentReservationQueue(equipmentId) {
        return await equipmentReservationRepository.findAllEquipmentReservationQueue(equipmentId);
    }
}

module.exports = new EquipmentReservationService();