const rateLimit = require('express-rate-limit');

// 1. Maximized Email-Trigger Limiter (Protects your SMTP wallet/quota)
const emailTriggerLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, 
    message: { error: "Too many requests matching email operations. Please try again in 15 minutes." },
    standardHeaders: true, 
    legacyHeaders: false,
});

// 2. Bruteforce Guessing Limiter (Protects the 6-digit OTP verification)
const verifyLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 5, 
    message: { error: "Too many incorrect OTP attempts. Try again in 5 minutes." },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    emailTriggerLimiter,
    verifyLimiter
};