const cron = require('node-cron');
const roomReservationRepository = require('../repositories/roomReservationRepository');
const equipmentReservationRepository = require('../repositories/equipmentReservationRepository');

function initExpirationCron() {
    // Scheduled to run every single minute (* * * * *)
    cron.schedule('* * * * *', async () => {
    try {
        const now = new Date();
        
        // Format to YYYY-MM-DD local time format
        const currentDate = now.toISOString().split('T')[0];
        
        // Format to HH:MM:SS local time format
        const currentTime = now.toTimeString().split(' ')[0];

        console.log(`[CRON] Checking for expired reservations at ${currentDate} ${currentTime}...`);

        // 1. Process Room Expirations
        const expiredRooms = await roomReservationRepository.expirePastRoomReservations(currentDate, currentTime);
        if (expiredRooms > 0) {
            console.log(`[CRON] Room Cleanup Success: Marked ${expiredRooms} reservations as expired.`);
        }

        // 2. Process Equipment Expirations
        const expiredEquipment = await equipmentReservationRepository.expirePastEquipmentReservations(currentDate, currentTime);
        if (expiredEquipment > 0) {
            console.log(`[CRON] Equipment Cleanup Success: Marked ${expiredEquipment} reservations as expired.`);
        }

        } catch (err) {
            console.error('[CRON ERROR] Failed running reservation expiration routine:', err);
        }
    });
    
    console.log('[CRON] Reservation expiration monitor initialized successfully.');
}

module.exports = { initExpirationCron };