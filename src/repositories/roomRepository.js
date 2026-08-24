const { pool } = require("../config/db");
class RoomRepository {
    async fetchAllRoomsSorted() {
        const [rows] = await pool.query(
            "SELECT room_id, room_name FROM room ORDER BY room_name"
        );
        return rows;
    }

    async insertRoom(roomName) {
        const [result] = await pool.query(
            "INSERT INTO room (room_name) VALUES (?)",
            [roomName]
        );
        return result.insertId;
    }

    async updateRoomFields(id, roomName) {
        const [result] = await pool.query(
            "UPDATE room SET room_name = ? WHERE room_id = ?",
            [roomName, id]
        );
        return result.affectedRows > 0;
    }
}

module.exports = new RoomRepository();