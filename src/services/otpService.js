const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
const mailer = require('../config/mailer');

class OTPService {
    async generateAndSaveOTP(email, role) {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const saltRounds = 10;
        const otpHash = await bcrypt.hash(otp, saltRounds);
        
        const dateNow = new Date(Date.now() + 10 * 60000);
        const expiresAt = new Date(dateNow.setHours(dateNow.getHours() + 8));

        await pool.query('DELETE FROM otps WHERE email = ?', [email]);
        await pool.query(
            'INSERT INTO otps (email, role, otp_hash, expires_at) VALUES (?, ?, ?, ?)',
            [email, role, otpHash, expiresAt]
        );

        await mailer.sendMail({
            to: email,
            subject: "CBSUA Verification Code",
            html: `
                <h2>Your Verification Code</h2>
                <h1>${otp}</h1>
                <p>Expires in 10 minutes</p>
            `
        });
    }

    async verifyOTP(email, role, providedOtp) {
        const [rows] = await pool.query(
            'SELECT * FROM otps WHERE email = ? AND role = ? AND expires_at > NOW()',
            [email, role]
        );
        if (rows.length === 0) return false;

        const isValid = await bcrypt.compare(providedOtp, rows[0].otp_hash);
        if (isValid) {
            await pool.query('DELETE FROM otps WHERE email = ? AND role = ?', [email, role]);
        }
        return isValid;
    }
}

module.exports = new OTPService();