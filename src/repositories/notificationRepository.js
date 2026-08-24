const { pool } = require("../config/db");

class NotificationRepository {
    async fetchUserNotifications(userId, role) {
        const [rows] = await pool.query(`
            SELECT n.*, 
               IFNULL(un.is_read, 0) as is_read,
               IFNULL(un.is_cleared, 0) as is_cleared
        FROM notifications n
        LEFT JOIN user_notifications un 
            ON n.id = un.notification_id 
            AND un.user_id = ? 
            AND un.user_role = ?
        WHERE 
            (IFNULL(un.is_cleared, 0) = 0) -- Hide cleared notifications
            
            -- EXCLUSION GUARD: Skip if this specific user is marked for exclusion
            AND (n.exclude_user_id IS NULL OR NOT (n.exclude_user_id = ? AND n.exclude_user_role = ?))
            
            -- Group target criteria
            AND (
                n.target_type = 'all'
                OR (n.target_type = 'all_admins' AND ? = 'admin')
                OR (n.target_type = 'all_instructors' AND ? = 'instructor')
                OR (n.target_type = 'all_students' AND ? = 'student')
                OR (n.target_type = 'specific_user' AND n.target_user_id = ? AND n.target_user_role = ?)
            )
        ORDER BY n.created_at DESC;
        `, [userId, role, userId, role, role, role, role, userId, role]);
        return rows;
    }

    async createNotification(title, message, target_type, target_user_id, target_user_role, exclude_user_id, exclude_user_role) {
        return await pool.query(`
            INSERT INTO notifications 
        (title, message, target_type, target_user_id, target_user_role, exclude_user_id, exclude_user_role) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [title, message, target_type, target_user_id || null, target_user_role || null, exclude_user_id || null, exclude_user_role || null]);
    }

    async updateSingleAsRead(userId, role, notificationId) {
        return await pool.query(`
            INSERT INTO user_notifications (user_id, user_role, notification_id, is_read) 
                 VALUES (?, ?, ?, 1) ON DUPLICATE KEY UPDATE is_read = 1
        `, [userId, role, notificationId]);
    }

    async updateAllUserNotificationsAsRead(userId, role) {
        return await pool.query(`
            INSERT INTO user_notifications (user_id, user_role, notification_id, is_read)
        SELECT ?, ?, n.id, 1
        FROM notifications n
        LEFT JOIN user_notifications un ON n.id = un.notification_id AND un.user_id = ? AND un.user_role = ?
        WHERE un.notification_id IS NULL OR un.is_read = 0
        ON DUPLICATE KEY UPDATE is_read = 1;
        `, [userId, role, userId, role]);
    }

    async updateSingleClearNotification(userId, role, notificationId) {
        return await pool.query(`
            INSERT INTO user_notifications (user_id, user_role, notification_id, is_cleared) 
                 VALUES (?, ?, ?, 1) ON DUPLICATE KEY UPDATE is_cleared = 1
        `, [userId, role, notificationId]);
    }

    async updateClearAllNotification(userId, role) {
        return await pool.query(`
            INSERT INTO user_notifications (user_id, user_role, notification_id, is_cleared)
        SELECT ?, ?, n.id, 1
        FROM notifications n
        LEFT JOIN user_notifications un ON n.id = un.notification_id AND un.user_id = ? AND un.user_role = ?
        WHERE (un.is_cleared IS NULL OR un.is_cleared = 0)
          AND (n.target_type = 'all' 
               OR (n.target_type = 'all_admins' AND ? = 'admin')
               OR (n.target_type = 'all_instructors' AND ? = 'instructor')
               OR (n.target_type = 'all_students' AND ? = 'student')
               OR (n.target_type = 'specific_user' AND n.target_user_id = ? AND n.target_user_role = ?))
        ON DUPLICATE KEY UPDATE is_cleared = 1;
        `, [userId, role, userId, role, role, role, role, userId, role]);
    }
}

module.exports = new NotificationRepository();