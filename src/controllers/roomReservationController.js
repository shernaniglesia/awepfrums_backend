const roomReservationService = require('../services/roomReservationService');

class RoomReservationController {
    async getAllRoomReservations(req, res) {
        try {
            const data = await roomReservationService.getAllRoomReservations();
            return res.json(data);
        } catch (err) {
            console.error("Error fetching reservations Controller:", err);
            return res.status(500).json({ message: "Server error fetching reservations." });
        }
    }

    async getAllUserRoomReservations(req, res) {
        try {
            const { instructorId } = req.params;
            const data = await roomReservationService.getAllUserRoomReservations(instructorId);
            return res.json(data);
        } catch (err) {
            console.error("Error fetching reservations Controller:", err);
            return res.status(500).json({ message: "Server error fetching reservations." });
        }
    }

    async createRoomReservation(req, res) {
        try {
            const { room_id, user_id, date, start_time, end_time, subject_id, year_section_id, sem_id } = req.body;

            if (!room_id || !user_id || !date || !start_time || !end_time || !subject_id || !year_section_id || !sem_id) {
                return res.status(400).json({ message: 'All fields are required.' });
            }

            const reservationId = await roomReservationService.createRoomReservation(req.body);
            if (!reservationId.success) {
                return res.status(400).json({ message: reservationId.message });
            }

            if (reservationId.success) {
                return res.status(201).json({ message: 'Reservation request submitted (pending approval).'});
            }
        } catch (err) {
            console.error('Error creating reservation Controller:', err);
            if (err.message.startsWith("CONFLICT_RESERVATION:") || err.message.startsWith("CONFLICT_SCHEDULE:")) {
                const timeFrame = err.message.split(":")[1];
                return res.status(400).json({ message: `Time conflict with existing approved reservation (${timeFrame}).` });
            }
            return res.status(500).json({ message: 'Server error creating reservation.' });
        }
    }

    async approveRoomReservation(req, res) {
        try {
            const { id } = req.params;
            const result = await roomReservationService.approveRoomReservation(id, req.body);

            if (!result.success) {
                return res.status(400).json({ message: result.message });
            }

            if (result.success) {
                return res.status(200).json({ message: "Reservation approved successfully." });
            }
        } catch (err) {
            console.error("Error approving reservation Controller:", err);
            if (err.message === "RESERVATION_NOT_FOUND") return res.status(404).json({ message: "Reservation not found" });
            if (err.message.startsWith("APPROVAL_CONFLICT:")) {
                const span = err.message.split(":")[1];
                return res.status(400).json({ message: `Conflict with another approved reservation (${span})` });
            }
            return res.status(500).json({ message: "Server error approving reservation." });
        }
    }

    async declineRoomReservation(req, res) {
        try {
            const { id } = req.params;
            await roomReservationService.declineRoomReservation(id, req.body);
            return res.json({ message: "Reservation rejected successfully." });
        } catch (err) {
            console.error("Error rejecting reservation Controller:", err);
            if (err.message === "RESERVATION_NOT_FOUND") return res.status(404).json({ message: "Reservation not found" });
            return res.status(500).json({ message: "Server error rejecting reservation." });
        }
    }

    async cancelRoomReservation(req, res) {
        try {
            const { id } = req.params;
            await roomReservationService.cancelRoomReservation(id, req.body);
            return res.json({ message: "Reservation cancelled successfully." });
        } catch (err) {
            console.error("Error cancelling reservation Controller:", err);
            if (err.message === "RESERVATION_NOT_FOUND") return res.status(404).json({ message: "Reservation not found" });
            return res.status(500).json({ message: "Server error cancelling reservation." });
        }
    }

    async removeRoomReservation(req, res) {
        try {
            const { id } = req.params;
            await roomReservationService.removeRoomReservation(id, req.body);
            return res.json({ message: "Reservation removed successfully." });
        } catch (err) {
            console.error("Error removing reservation Controller:", err);
            if (err.message === "RESERVATION_NOT_FOUND") return res.status(404).json({ message: "Reservation not found" });
            return res.status(500).json({ message: "Server error removing reservation." });
        }
    }

    async getAllRoomReservationLogs(req, res) {
        try {
            const logs = await roomReservationService.getAllRoomReservationLogs();
            return res.json(logs);
        } catch (err) {
            console.error("Error fetching reservation logs Controller:", err);
            return res.status(500).json({ message: "Server error fetching reservation logs." });
        }
    }

    async getAllUserRoomReservationLogs(req, res) {
        try {
            const { instructorId } = req.params;
            const logs = await roomReservationService.getAllUserRoomReservationLogs(instructorId);
            return res.json(logs);
        } catch (err) {
            console.error("Error fetching reservation logs Controller:", err);
            return res.status(500).json({ message: "Server error fetching reservation logs." });
        }
    }
}

module.exports = new RoomReservationController();