const roomRepository = require("../repositories/roomRepository");

class RoomService {
    async getAllRooms() {
        return await roomRepository.fetchAllRoomsSorted();
    }

    async addRoom(roomName) {
        if (!roomName) {
            throw new Error("ROOM_NAME_REQUIRED");
        }
        
        const capitalized = roomName.toUpperCase();
        const insertId = await roomRepository.insertRoom(capitalized);
        return insertId;
    }

    async modifyRoom(id, roomName) {
        const isUpdated = await roomRepository.updateRoomFields(id, roomName);
        if (!isUpdated) {
            throw new Error("ROOM_NOT_FOUND");
        }
        return true;
    }
}

module.exports = new RoomService();