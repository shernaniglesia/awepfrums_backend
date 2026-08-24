const bcrypt = require("bcryptjs");
const userRepository = require("../repositories/userRepository");

class UserService {
    validateRole(role) {
        const allowed = ["admin", "instructor", "student"];
        if (!allowed.includes(role?.toLowerCase())) {
            throw new Error("INVALID_ROLE");
        }
        return role.toLowerCase();
    }

    validatePasswordComplexity(password) {
        const minLength = 8;
        if (password.length < minLength) return "Password must be at least 8 characters.";
        if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter.";
        if (!/[a-z]/.test(password)) return "Password must contain at least one lowercase letter.";
        if (!/[0-9]/.test(password)) return "Password must contain at least one number.";
        return null;
    }

    async getAllSystemUsers() {
        const [admins, instructors, students] = await Promise.all([
            userRepository.fetchAllVerifiedAdmins(),
            userRepository.fetchAllVerifiedInstructors(),
            userRepository.fetchAllVerifiedStudents()
        ]);
        return [...admins, ...instructors, ...students];
    }

    async registerUser({ name, email, password, role }) {
        const targetRole = this.validateRole(role);

        if (!email.endsWith("@cbsua.edu.ph")) {
            throw new Error("INVALID_EMAIL_DOMAIN");
        }

        const existingUser = await userRepository.findByEmail(email, targetRole);
        if (existingUser) {
            throw new Error("EMAIL_ALREADY_REGISTERED");
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const insertId = await userRepository.insertUser(name, email, hashedPassword, targetRole);
        return { id: insertId, role: targetRole };
    }

    async modifyUser(id, role, { name, email, oldEmail }) {
        const targetRole = this.validateRole(role);

        if (email !== oldEmail) {
            const existingUser = await userRepository.findByEmail(email, targetRole);
            if (existingUser) {
                throw new Error("EMAIL_ALREADY_REGISTERED");
            }
        }

        const isUpdated = await userRepository.updateUserFields(id, name, email, targetRole);
        if (!isUpdated) {
            throw new Error("USER_NOT_FOUND");
        }
        return true;
    }

    async getInstructorList() {
        return await userRepository.fetchAllRawInstructors();
    }

    async changeUserPassword(id, role, currentPassword, newPassword) {
        const targetRole = this.validateRole(role);

        const user = await userRepository.findById(id, targetRole);
        if (!user) {
            throw new Error("USER_NOT_FOUND");
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            throw new Error("INCORRECT_CURRENT_PASSWORD");
        }

        const validationError = this.validatePasswordComplexity(newPassword);
        if (validationError) {
            const err = new Error("PASSWORD_COMPLEXITY_FAILED");
            err.details = validationError;
            throw err;
        }

        const newHashedPassword = await bcrypt.hash(newPassword, 10);
        return await userRepository.updatePassword(id, newHashedPassword, targetRole);
    }
}

module.exports = new UserService();