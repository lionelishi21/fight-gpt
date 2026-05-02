"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationRoutes = void 0;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
class NotificationRoutes {
    notificationController;
    router;
    constructor(notificationController) {
        this.notificationController = notificationController;
        this.router = (0, express_1.Router)();
        this.setupRoutes();
    }
    setupRoutes() {
        // All notification routes require authentication
        this.router.use(auth_1.authMiddleware);
        this.router.get('/', this.notificationController.getMyNotifications);
        this.router.get('/unread-count', this.notificationController.getUnreadCount);
        this.router.patch('/read-all', this.notificationController.markAllRead);
        this.router.patch('/:id/read', this.notificationController.markAsRead);
    }
    getRouter() {
        return this.router;
    }
}
exports.NotificationRoutes = NotificationRoutes;
exports.default = NotificationRoutes;
//# sourceMappingURL=notificationRoutes.js.map