const bcrypt = require("bcryptjs");
const authRepository = require("../repositories/authRepository");
const otpService = require("./otpService");
const jwtService = require("./jwtService");

class AuthService {
    async requestOTP(email, role) {
        await otpService.generateAndSaveOTP(email, role);
    }

    async verifyOTP(email, role, otp) {
        const isMatch = await otpService.verifyOTP(email, role, otp);
        if (!isMatch) return null;

        await authRepository.verifyUserEmail(email, role);
        return jwtService.generateResetToken(email, role);
    }

    async signup(name, email, password, role) {
        const existingUser = await authRepository.findUserByEmail(email, role);
        if (existingUser) throw new Error("Email already registered");

        const hashed = await bcrypt.hash(password, 10);
        await authRepository.createUser(name, email, hashed, role);
        await otpService.generateAndSaveOTP(email, role);
    }

    async login(email, password, role) {
        const user = await authRepository.findUserByEmail(email, role);
        if (!user) return { error: "User not found", status: 404 };

        const valid = await bcrypt.compare(password, user.user_password);
        if (!valid) return { error: "Invalid credentials", status: 401 };

        if (!user.is_verified) {
            await otpService.generateAndSaveOTP(email, role);
            return { requireOTP: true };
        }

        const accessToken = jwtService.generateAccessToken(user);
        const refreshToken = jwtService.generateRefreshToken(user);

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);


        await authRepository.saveRefreshToken(user.user_id, user.user_role, refreshToken, expiresAt);

        return { accessToken, refreshToken, role: user.user_role };
    }

    async refresh(token) {
        const tokenData = await authRepository.findRefreshToken(token);
        if (!tokenData) throw new Error("Invalid or expired refresh token");

        const decoded = jwtService.verifyRefreshToken(token);

        const user = await authRepository.findUserByEmail(decoded.user_email, decoded.user_role);
        
        const newAccessToken = jwtService.generateAccessToken(user);
        return { accessToken: newAccessToken };
    }

    async logout(token) {
        await authRepository.deleteRefreshToken(token);
    }

    async forgotPassword(email, role) {
        const user = await authRepository.findUserByEmail(email, role);
        if (!user) throw new Error("User not found");

        await otpService.generateAndSaveOTP(email, role);
    }

    async resetPassword(token, newPassword) {
        const decoded = jwtService.verifyToken(token, process.env.JWT_SECRET);
        const hashed = await bcrypt.hash(newPassword, 10);
        await authRepository.updatePassword(decoded.email, decoded.role, hashed);
    }
}

module.exports = new AuthService();