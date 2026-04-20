import { BaseRepository } from './BaseRepository';
import Notification, { INotification } from '../models/Notification';

export interface INotificationRepository {
    createNotification(data: Partial<INotification>): Promise<INotification>;
    getNotificationsByUserId(userId: string, limit?: number): Promise<INotification[]>;
    getUnreadCount(userId: string): Promise<number>;
    markAsRead(notificationId: string): Promise<INotification | null>;
    markAllRead(userId: string): Promise<void>;
    broadcastToAllUsers(data: Omit<Partial<INotification>, 'userId'>): Promise<void>;
}

export class NotificationRepository extends BaseRepository<INotification> implements INotificationRepository {
    constructor() {
        super(Notification);
    }

    public async createNotification(data: Partial<INotification>): Promise<INotification> {
        return this.model.create(data);
    }

    public async getNotificationsByUserId(userId: string, limit: number = 20): Promise<INotification[]> {
        return this.model.find({ userId }).sort({ createdAt: -1 }).limit(limit).exec();
    }

    public async getUnreadCount(userId: string): Promise<number> {
        return this.model.countDocuments({ userId, isRead: false }).exec();
    }

    public async markAsRead(notificationId: string): Promise<INotification | null> {
        return this.model.findByIdAndUpdate(notificationId, { isRead: true }, { new: true }).exec();
    }

    public async markAllRead(userId: string): Promise<void> {
        await this.model.updateMany({ userId, isRead: false }, { isRead: true }).exec();
    }

    // Fan-out: create one notification per user
    public async broadcastToAllUsers(data: Omit<Partial<INotification>, 'userId'>): Promise<void> {
        const User = (await import('../models/User')).default;
        const users = await User.find({}, '_id').lean();
        const docs = users.map(u => ({ ...data, userId: u._id }));
        if (docs.length) await this.model.insertMany(docs, { ordered: false });
    }
}

export default NotificationRepository;
