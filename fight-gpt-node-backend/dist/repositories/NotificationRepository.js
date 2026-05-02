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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
const Notification_1 = __importDefault(require("../models/Notification"));
class NotificationRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super(Notification_1.default);
    }
    async createNotification(data) {
        return this.model.create(data);
    }
    async getNotificationsByUserId(userId, limit = 20) {
        return this.model.find({ userId }).sort({ createdAt: -1 }).limit(limit).exec();
    }
    async getUnreadCount(userId) {
        return this.model.countDocuments({ userId, isRead: false }).exec();
    }
    async markAsRead(notificationId) {
        return this.model.findByIdAndUpdate(notificationId, { isRead: true }, { new: true }).exec();
    }
    async markAllRead(userId) {
        await this.model.updateMany({ userId, isRead: false }, { isRead: true }).exec();
    }
    // Fan-out: create one notification per user
    async broadcastToAllUsers(data) {
        const User = (await Promise.resolve().then(() => __importStar(require('../models/User')))).default;
        const users = await User.find({}, '_id').lean();
        const docs = users.map(u => ({ ...data, userId: u._id }));
        if (docs.length)
            await this.model.insertMany(docs, { ordered: false });
    }
}
exports.NotificationRepository = NotificationRepository;
exports.default = NotificationRepository;
//# sourceMappingURL=NotificationRepository.js.map