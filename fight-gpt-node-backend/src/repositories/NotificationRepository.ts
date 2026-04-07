import { BaseRepository } from './BaseRepository';
import Notification, { INotification } from '../models/Notification';

export interface INotificationRepository {
    createNotification(data: Partial<INotification>): Promise<INotification>;
    getNotificationsByUserId(userId: string, limit?: number): Promise<INotification[]>;
    markAsRead(notificationId: string): Promise<INotification | null>;
}

export class NotificationRepository extends BaseRepository<INotification> implements INotificationRepository {
    constructor() {
        super(Notification);
    }

    public async createNotification(data: Partial<INotification>): Promise<INotification> {
        return this.model.create(data);
    }

    public async getNotificationsByUserId(userId: string, limit: number = 20): Promise<INotification[]> {
        return this.model.find({ userId })
            .sort({ createdAt: -1 })
            .limit(limit)
            .exec();
    }

    public async markAsRead(notificationId: string): Promise<INotification | null> {
        return this.model.findByIdAndUpdate(
            notificationId,
            { isRead: true },
            { new: true }
        ).exec();
    }
}

export default NotificationRepository;
