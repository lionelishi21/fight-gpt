"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationController = void 0;
const BaseController_1 = require("./BaseController");
class NotificationController extends BaseController_1.BaseController {
    notificationRepository;
    constructor(notificationRepository) {
        super();
        this.notificationRepository = notificationRepository;
    }
    getMyNotifications = async (req, res) => {
        try {
            const userId = req.user?.id || req.user?._id;
            const limit = parseInt(req.query.limit) || 20;
            const notifications = await this.notificationRepository.getNotificationsByUserId(userId, limit);
            this.sendResponse(res, { success: true, data: notifications });
        }
        catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to fetch notifications', 500);
        }
    };
    getUnreadCount = async (req, res) => {
        try {
            const userId = req.user?.id || req.user?._id;
            const count = await this.notificationRepository.getUnreadCount(userId);
            this.sendResponse(res, { success: true, data: { count } });
        }
        catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to fetch unread count', 500);
        }
    };
    markAsRead = async (req, res) => {
        try {
            const { id } = req.params;
            const notification = await this.notificationRepository.markAsRead(id);
            if (!notification) {
                this.sendError(res, 'Notification not found', 404);
                return;
            }
            this.sendResponse(res, { success: true, data: notification });
        }
        catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to mark as read', 500);
        }
    };
    markAllRead = async (req, res) => {
        try {
            const userId = req.user?.id || req.user?._id;
            await this.notificationRepository.markAllRead(userId);
            this.sendResponse(res, { success: true, data: { message: 'All notifications marked as read' } });
        }
        catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to mark all as read', 500);
        }
    };
}
exports.NotificationController = NotificationController;
exports.default = NotificationController;
//# sourceMappingURL=NotificationController.js.map