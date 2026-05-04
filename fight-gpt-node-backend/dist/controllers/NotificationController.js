"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
    registerPushToken = async (req, res) => {
        try {
            const userId = req.user?.id || req.user?._id;
            const { token } = req.body;
            if (!token) {
                this.sendError(res, 'Push token is required', 400);
                return;
            }
            const User = (await Promise.resolve().then(() => __importStar(require('../models/User')))).default;
            await User.updateOne({ _id: userId }, { $addToSet: { pushTokens: token } });
            this.sendResponse(res, { success: true, message: 'Push token registered successfully' });
        }
        catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to register push token', 500);
        }
    };
}
exports.NotificationController = NotificationController;
exports.default = NotificationController;
//# sourceMappingURL=NotificationController.js.map