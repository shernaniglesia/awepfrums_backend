const notificationService = require("../services/notificationService");

class NotificationController {
    async getNotifications(req, res) {
        try {
            const { role, userId } = req.params;
            const rows = await notificationService.getUserNotifications(userId, role);
            return res.json(rows);
        } catch (e) {
            console.error("Error inside Controller getNotifications:", e);
            return res.status(500).json({ message: "Error getting notification." });
        }
    }

    async markAsRead(req, res) {
        try {
            const { userId, role, notificationId } = req.body;
            await notificationService.markNotificationAsRead(userId, role, notificationId);
            return res.sendStatus(200);
        } catch (e) {
            console.error("Error inside Controller markAsRead:", e);
            return res.status(500).json({ message: "Error marking notification as read." });
        }
    }

    async markAllAsRead(req, res) {
        try {
            const { userId, role } = req.body;
            await notificationService.markAllNotificationsAsRead(userId, role);
            return res.sendStatus(200);
        } catch (e) {
            console.error("Error inside Controller markAllAsRead:", e);
            return res.status(500).json({ message: "Error marking all notifications as read." });
        }
    }

    async markAsClear(req, res) {
        try {
            const { userId, role, notificationId } = req.body;
            await notificationService.markNotificationAsClear(userId, role, notificationId);
            return res.sendStatus(200);
        } catch (e) {
            console.error("Error inside Controller markAsClear:", e);
            return res.status(500).json({ message: "Error marking notification as clear." });
        }
    }

    async markAllAsClear(req, res) {
        try {
            const { userId, role } = req.body;
            await notificationService.markAllNotificationsAsClear(userId, role);
            return res.sendStatus(200);
        } catch (e) {
            console.error("Error inside Controller markAllAsClear:", e);
            return res.status(500).json({ message: "Error marking all notifications as clear." });
        }
    }
}

module.exports = new NotificationController();