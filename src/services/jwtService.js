const jwt = require("jsonwebtoken");
require("dotenv").config();

class JwtService {
    generateAccessToken(user) {
        return jwt.sign(
            {
                user_id: user.user_id,
                user_name: user.user_name,
                user_email: user.user_email,
                user_role: user.user_role,
            },
            process.env.JWT_ACCESS_SECRET,
            { expiresIn: "15m" }
        );
    }

    generateRefreshToken(user) {
        return jwt.sign(
            { 
                user_id: user.user_id, 
                user_email: user.user_email, 
                user_role: user.user_role 
            },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: "7d" }
        );
    }

    verifyAccessToken(token) {
        return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    }

    verifyRefreshToken(token) {
        return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    }

    generateResetToken(email, role) {
        return jwt.sign(
            { email: email, role: role },
            process.env.JWT_SECRET,
            { expiresIn: "10m" }
        );
    }

    verifyToken(token, secret) {
        return jwt.verify(token, secret);
    }
}

module.exports = new JwtService();