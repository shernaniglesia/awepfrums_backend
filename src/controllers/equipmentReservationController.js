const equipmentReservationService = require("../services/equipmentReservationService");

class EquipmentReservationController {
    async getEquipmentReservations(req, res) {
        try {
            const data = await equipmentReservationService.getEquipmentReservations();
            return res.json(data);
        } catch (err) {
            console.error("Error fetching equipment reservations Controller:", err);
            return res.status(500).json({ message: "Server error fetching reservations" });
        }
    }

    async getUserEquipmentReservations(req, res) {
        try {
            const { role, userId } = req.params;
            const data = await equipmentReservationService.getUserEquipmentReservations(role, userId);
            return res.json(data);
        } catch (err) {
            console.error("Error fetching equipment reservations Controller:", err);
            return res.status(500).json({ message: "Server error fetching reservations" });
        }
    }

    async createEquipmentReservation(req, res) {
        const { equipment_id, equipment_reservation_user_type, equipment_reservation_reference_id, equipment_reservation_date, equipment_reservation_start_time, equipment_reservation_end_time } = req.body;
        
        if (!equipment_id || !equipment_reservation_user_type || !equipment_reservation_reference_id || !equipment_reservation_date || !equipment_reservation_start_time || !equipment_reservation_end_time) {
            return res.status(400).json({ message: "All fields are required." });
        }

        try {
            const insertId = await equipmentReservationService.createEquipmentReservation(req.body);
            return res.json({ message: "Reservation request submitted.", id: insertId });
        } catch (err) {
            console.error("Error creating equipment reservation Controller:", err);
            if (err.message.startsWith("CONFLICT_RESERVATION:")) {
                const timeFrame = err.message.split(":")[1];
                return res.status(400).json({ message: `Conflict with another reservation ${timeFrame}.` });
            }
            return res.status(500).json({ message: "Server error creating reservation." });
        }
    }

    async approveEquipmentReservation(req, res) {
        const { id } = req.params;
        try {
            await equipmentReservationService.approveEquipmentReservation(id, req.body);
            return res.json({ message: "Reservation approved successfully." });
        } catch (err) {
            console.error("Error approving equipment reservation Controller:", err);
            if (err.message === "RESERVATION_NOT_FOUND") return res.status(404).json({ message: "Reservation not found" });
            if (err.message.startsWith("CONFLICT_APPROVAL:")) {
                const timeFrame = err.message.split(":")[1];
                const [start, end] = timeFrame.split("-");
                return res.status(400).json({ 
                message: `Cannot approve. Equipment is already reserved from ${equipmentReservationService.fTime(start)} to ${equipmentReservationService.fTime(end)}.` 
                });
            }
            return res.status(500).json({ message: "Server error during approval." });
        }
    }

    async declineEquipmentReservation(req, res) {
        const { id } = req.params;
        try {
            await equipmentReservationService.declineEquipmentReservation(id, req.body);
            return res.json({ message: "Reservation rejected." });
        } catch (err) {
            console.error("Error rejecting equipment reservation Controller:", err);
            if (err.message === "RESERVATION_NOT_FOUND") return res.status(404).json({ message: "Reservation not found" });
            return res.status(500).json({ message: "Server error rejecting reservation." });
        }
    }

    async cancelEquipmentReservation(req, res) {
        const { id } = req.params;
        try {
            await equipmentReservationService.cancelEquipmentReservation(id, req.body);
            return res.json({ message: "Reservation cancelled." });
        } catch (err) {
            console.error("Error cancelling equipment reservation Controller:", err);
            if (err.message === "RESERVATION_NOT_FOUND") return res.status(404).json({ message: "Reservation not found" });
            return res.status(500).json({ message: "Server error cancelling reservation." });
        }
    }

    async borrowEquipmentReservation(req, res) {
        const { id } = req.params;
        try {
            await equipmentReservationService.borrowEquipmentReservation(id, req.body);
            return res.json({ message: "Equipment marked as borrowed." });
        } catch (err) {
            console.error("Borrow error Controller:", err);
            if (err.message === "RESERVATION_NOT_FOUND") return res.status(404).json({ message: "Reservation not found" });
            if (err.message.startsWith("EQUIPMENT_HELD_BY:")) {
                const currentHolder = err.message.split(":")[1];
                return res.status(400).json({ 
                message: `Cannot borrow. This equipment is currently held by ${currentHolder} and has not been returned yet.` 
                });
            }
            return res.status(500).json({ message: "Server error during borrow process." });
        }
    }

    async returnEquipmentReservation(req, res) {
        const { id } = req.params;
        try {
            await equipmentReservationService.returnEquipmentReservation(id, req.body);
            return res.json({ message: "Equipment returned successfully." });
        } catch (err) {
            console.error("Return error Controller:", err);
            if (err.message === "RESERVATION_NOT_FOUND") return res.status(404).json({ message: "Reservation not found" });
            return res.status(500).json({ message: "Server error during return process." });
        }
    }

    async getAllEquipmentReservationLogs(req, res) {
        try {
            const logs = await equipmentReservationService.getAllEquipmentReservationLogs();
            return res.json(logs);
        } catch (err) {
            console.error("Error fetching reservation logs Controller:", err);
            return res.status(500).json({ message: "Server error fetching reservation logs." });
        }
    }

    async getAllUserEquipmentReservationLogs(req, res) {
        try {
            const { role, userId } = req.params;
            const logs = await equipmentReservationService.getAllUserEquipmentReservationLogs(role, userId);
            return res.json(logs);
        } catch (err) {
            console.error("Error fetching reservation logs Controller:", err);
            return res.status(500).json({ message: "Server error fetching reservation logs." });
        }
    }

    async getAllEquipmentReservationQueue(req, res) {
        const { id } = req.params;
        try {
            const logs = await equipmentReservationService.getAllEquipmentReservationQueue(id);
            return res.json(logs);
        } catch (err) {
            console.error("Error fetching reservation queue Controller:", err);
            return res.status(500).json({ message: "Server error fetching reservation queues." });
        }
    }
}

module.exports = new EquipmentReservationController();