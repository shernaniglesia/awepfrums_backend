const jwtService = require("../services/jwtService");

const protectRoute = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Access denied. No token provided." });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwtService.verifyAccessToken(token);

        req.user = decoded; 
        
        next();
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ 
                errorCode: "TOKEN_EXPIRED", 
                message: "Access token has expired." 
            });
        }
        return res.status(403).json({ message: "Invalid access token." });
    }
};

module.exports = protectRoute;