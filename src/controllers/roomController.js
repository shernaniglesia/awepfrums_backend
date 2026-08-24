const roomService = require("../services/roomService");

class RoomController {
    async listRooms(_req, res) {
        try {
            const rows = await roomService.getAllRooms();
            return res.json(rows);
        } catch (e) {
            console.error("Error in RoomController.listRooms:", e);
            return res.status(500).json({ message: "Error fetching rooms" });
        }
    }

    async createRoom(req, res) {
        try {
            const { roomName } = req.body;
            const roomId = await roomService.addRoom(roomName);
            
            return res.status(201).json({
                message: "Room created successfully",
                room_id: roomId
            });
        } catch (err) {
            console.error("Error in RoomController.createRoom:", err);
            if (err.message === "ROOM_NAME_REQUIRED") {
                return res.status(400).json({ message: "Room name is required." });
            }
            return res.status(500).json({ message: "Server error" });
        }
    }

    async updateRoom(req, res) {
        try {
            const { id } = req.params;
            const { roomName } = req.body;
            
            await roomService.modifyRoom(id, roomName);
            return res.json({ message: "Room updated successfully" });
        } catch (e) {
            console.error("Error in RoomController.updateRoom:", e);
            if (e.message === "ROOM_NOT_FOUND") {
                return res.status(404).json({ message: "Room not found" });
            }
            return res.status(500).json({ message: "Error updating room" });
        }
    }
}

module.exports = new RoomController();