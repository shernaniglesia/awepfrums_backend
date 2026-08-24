const equipmentService = require("../services/equipmentService");

class EquipmentController {
    async getAllEquipment(req, res) {
        try {
            const data = await equipmentService.getAllEquipment();
            return res.json(data);
        } catch (err) {
            console.error("Error fetching equipment Controller:", err);
            return res.status(500).json({ message: "Server error" });
        }
    }

    async createEquipment(req, res) {
        try {
            await equipmentService.createEquipment(req.body);
            return res.json({ message: "Equipment added successfully" });
        } catch (err) {
            console.error("Error creating equipment Controller:", err);
        
            if (err.message === "NAME_REQUIRED") {
                return res.status(400).json({ message: "Name is required" });
            }
        
            return res.status(500).json({ message: "Server error" });
        }
    }

    async updateEquipment(req, res) {
        try {
            const { id } = req.params;
            await equipmentService.updateEquipment(id, req.body);
            return res.json({ message: "Equipment updated successfully" });
        } catch (err) {
            console.error("Error updating equipment Controller:", err);
        
            if (err.message === "EQUIPMENT_NOT_FOUND") {
                return res.status(404).json({ message: "Equipment not found" });
            }
        
            return res.status(500).json({ message: "Server error" });
        }
    }

    async getAllEquipmentReservationQueue(req, res) {
        const { id } = req.params;
        try {
            const logs = await equipmentService.getAllEquipmentReservationQueue(id);
            return res.json(logs);
        } catch (err) {
            console.error("Error fetching reservation queue Controller:", err);
            return res.status(500).json({ message: "Server error fetching reservation queues." });
        }
    }
}

module.exports = new EquipmentController();