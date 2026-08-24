const equipmentRepository = require("../repositories/equipmentRepository");

class EquipmentService {
    async getAllEquipment() {
        return await equipmentRepository.findAllEquipment();
    }

    async createEquipment(equipmentData) {
        const { equipmentName, equipmentDescription, equipmentStatus } = equipmentData;
        
        if (!equipmentName) {
            throw new Error("NAME_REQUIRED");
        }

        return await equipmentRepository.insertEquipment(equipmentName, equipmentDescription, equipmentStatus);
    }

    async updateEquipment(id, equipmentData) {
        const { equipmentName, equipmentDescription, equipmentStatus } = equipmentData;

        const wasUpdated = await equipmentRepository.updateEquipment(id, equipmentName, equipmentDescription, equipmentStatus);

        if (!wasUpdated) {
            throw new Error("EQUIPMENT_NOT_FOUND");
        }

        return true;
    }

    async getAllEquipmentReservationQueue(equipmentId) {
        return await equipmentRepository.findAllEquipmentReservationQueue(equipmentId);
    }
}

module.exports = new EquipmentService();