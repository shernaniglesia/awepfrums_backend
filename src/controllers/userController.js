const userService = require("../services/userService");

class UserController {
    async listUsers(_req, res) {
        try {
            const users = await userService.getAllSystemUsers();
            return res.json(users);
        } catch (e) {
            console.error("Error in listUsers:", e);
            return res.status(500).json({ message: "Error fetching users" });
        }
    }

    async createUser(req, res) {
        try {
            const { name, email, password, role } = req.body;
            if (!name || !email || !password || !role) {
                return res.status(400).json({ message: "Missing fields" });
            }

            const result = await userService.registerUser({ name, email, password, role });
            return res.json({
                message: `${result.role} added successfully`,
                id: result.id
            });
        } catch (e) {
            console.error("Error in createUser:", e);
            if (e.message === "INVALID_EMAIL_DOMAIN") {
                return res.status(400).json({ message: "CBSUA email required" });
            }
            if (e.message === "EMAIL_ALREADY_REGISTERED") {
                return res.status(404).json({ message: "Email already registered" });
            }
            if (e.message === "INVALID_ROLE") {
                return res.status(400).json({ message: "Provided user tier role setup is invalid" });
            }
            return res.status(500).json({ message: "Error adding user" });
        }
    }

    async updateUser(req, res) {
        try {
            const { id, role } = req.params;
            const { name, email, oldEmail } = req.body;

            await userService.modifyUser(id, role, { name, email, oldEmail });
            return res.json({ message: "User updated successfully" });
        } catch (e) {
            console.error("Error in updateUser:", e);
            if (e.message === "EMAIL_ALREADY_REGISTERED") {
                return res.status(404).json({ message: "Email already registered" });
            }
            if (e.message === "USER_NOT_FOUND") {
                return res.status(404).json({ message: "User not found" });
            }
            return res.status(500).json({ message: "Error updating user" });
        }
    }

    async getInstructors(req, res) {
        try {
            const rows = await userService.getInstructorList();
            return res.json(rows);
        } catch (err) {
            console.error("Error fetching instructors:", err);
            return res.status(500).json({ message: "Server error while fetching instructors" });
        }
    }

    async resetPassword(req, res) {
        try {
            const { role, id } = req.params;
            const { currentPassword, newPassword } = req.body;

            if (!currentPassword || !newPassword) {
                return res.status(400).json({ message: "All fields are required." });
            }

            await userService.changeUserPassword(id, role, currentPassword, newPassword);
            return res.json({ message: "Password updated successfully." });
        } catch (err) {
            console.error("RESET PASSWORD ERROR:", err);
            if (err.message === "USER_NOT_FOUND") {
                return res.status(404).json({ message: "User not found" });
            }
            if (err.message === "INCORRECT_CURRENT_PASSWORD") {
                return res.status(401).json({ message: "Old password is incorrect." });
            }
            if (err.message === "PASSWORD_COMPLEXITY_FAILED") {
                return res.status(400).json({ message: err.details });
            }
            return res.status(500).json({ message: "Server error." });
        }
    }
}

module.exports = new UserController();