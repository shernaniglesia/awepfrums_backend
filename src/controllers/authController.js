const authService = require("../services/authService");

class AuthController {
    async requestOTP(req, res) {
        try {
            const { email, role } = req.body;
            await authService.requestOTP(email, role.toLowerCase());
            res.status(200).json({ message: "OTP sent to email" });
        } catch (error) {
            res.status(500).json({ error: "Failed to send OTP" });
        }
    }

    async verifyOTP(req, res) {
        try {
            const { email, role, otp } = req.body;
            const smallRole = role.toLowerCase();
            
            const resetToken = await authService.verifyOTP(email, smallRole, otp);
            if (!resetToken) {
                return res.status(400).json({ error: "Invalid or expired OTP" });
            }

            return res.status(200).json({ resetToken, message: "Verification successful" });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Verification failed" });
        }
    }

    async signup(req, res) {
        const { name, email, password, role } = req.body;
        const smallRole = role.toLowerCase();

        if (!email.endsWith("@cbsua.edu.ph")) {
            return res.status(400).json({ message: "CBSUA email required" });
        }

        try {
            await authService.signup(name, email, password, smallRole);
            res.json({ requireOTP: true, email, message: "Account created. OTP sent." });
        } catch (err) {
            if (err.message === "Email already registered") {
                return res.status(404).json({ message: err.message });
            }
            console.error(err);
            res.status(500).json({ message: "Signup failed" });
        }
    }

    async login(req, res) {
        const { email, password, role } = req.body;
        const smallRole = role.toLowerCase();

        try {
            const result = await authService.login(email, password, smallRole);
            
            if (result.error) {
                return res.status(result.status).json({ message: result.error });
            }
            if (result.requireOTP) {
                return res.json({ requireOTP: true, email, smallRole, message: "Account not verified. OTP sent." });
            }

            res.json({ 
                accessToken: result.accessToken,
                refreshToken: result.refreshToken,
                role: result.role 
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: "Login failed" });
        }
    }

    async refresh(req, res) {
        const { refreshToken } = req.body; 
        if (!refreshToken) return res.status(401).json({ message: "Refresh token missing" });

        try {
            const result = await authService.refresh(refreshToken);
            res.json({ accessToken: result.accessToken });
        } catch (err) {
            res.status(403).json({ message: "Invalid refresh token session" });
        }
    }

    async logout(req, res) {
        try {
            const { refreshToken } = req.body; 
            
            if (refreshToken) {
                await authService.logout(refreshToken);
            }
            
            return res.json({ message: "Logged out successfully from server" });
        } catch (err) {
            console.error("Logout error:", err);
            return res.status(500).json({ message: "Server logout failed" });
        }
    }

    async forgotPassword(req, res) {
        const { email, role } = req.body;
        const smallRole = role.toLowerCase();

        try {
            await authService.forgotPassword(email, smallRole);
            res.json({ requireOTP: true, email, smallRole, message: "OTP sent for password reset" });
        } catch (err) {
            if (err.message === "User not found") {
                return res.status(404).json({ message: err.message });
            }
            console.error(err);
            res.status(500).json({ message: "OTP send failed" });
        }
    }

    async resetPassword(req, res) {
        const { token, newPassword } = req.body;
        if (!token || !newPassword) {
            return res.status(400).json({ message: "Missing token or password" });
        }

        try {
            await authService.resetPassword(token, newPassword);
            return res.json({ message: "Password reset successful" });
        } catch (err) {
            return res.status(400).json({ message: "Invalid or expired token" });
        }
    }
}

module.exports = new AuthController();