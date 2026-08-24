const notificationRepository = require("../repositories/notificationRepository");

class NotificationService {
    async getUserNotifications(userId, role) {
        return await notificationRepository.fetchUserNotifications(userId, role.toLowerCase());
    }

    async createNotification(title, message, type, target_type, target_user_id, target_user_role) {
        return await notificationRepository.createNotification(title, message, type, target_type, target_user_id, target_user_role);
    }

    async markNotificationAsRead(userId, role, notificationId) {
        return await notificationRepository.updateSingleAsRead(userId, role.toLowerCase(), notificationId);
    }

    async markAllNotificationsAsRead(userId, role) {
        return await notificationRepository.updateAllUserNotificationsAsRead(userId, role.toLowerCase());
    }

    async markNotificationAsClear(userId, role, notificationId) {
        return await notificationRepository.updateSingleClearNotification(userId, role.toLowerCase(), notificationId);
    }

    async markAllNotificationsAsClear(userId, role) {
        return await notificationRepository.updateClearAllNotification(userId, role.toLowerCase());
    }
}

module.exports = new NotificationService();