const express = require('express');
const router = express.Router();

const {
    requestOTP,
    verifyOTP,
    signup,
    login,
    refresh,
    logout,
    forgotPassword,
    resetPassword
} = require("../controllers/authController");

const { emailTriggerLimiter, verifyLimiter } = require("../middleware/rateLimiter");

router.post("/requestOTP", emailTriggerLimiter, requestOTP);
router.post("/signup", emailTriggerLimiter, signup);
router.post("/login", login);
// router.post("/login", emailTriggerLimiter, login);
router.post("/forgotPassword", emailTriggerLimiter, forgotPassword);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.post("/verifyOTP", verifyLimiter, verifyOTP);
router.post("/resetPassword", resetPassword);

module.exports = router;