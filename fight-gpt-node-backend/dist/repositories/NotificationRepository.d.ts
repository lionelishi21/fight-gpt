import { BaseRepository } from './BaseRepository';
import { INotification } from '../models/Notification';
export interface INotificationRepository {
    createNotification(data: Partial<INotification>): Promise<INotification>;
    getNotificationsByUserId(userId: string, limit?: number): Promise<INotification[]>;
    getUnreadCount(userId: string): Promise<number>;
    markAsRead(notificationId: string): Promise<INotification | null>;
    markAllRead(userId: string): Promise<void>;
    broadcastToAllUsers(data: Omit<Partial<INotification>, 'userId'>): Promise<void>;
}
export declare class NotificationRepository extends BaseRepository<INotification> implements INotificationRepository {
    constructor();
    createNotification(data: Partial<INotification>): Promise<INotification>;
    getNotificationsByUserId(userId: string, limit?: number): Promise<INotification[]>;
    getUnreadCount(userId: string): Promise<number>;
    markAsRead(notificationId: string): Promise<INotification | null>;
    markAllRead(userId: string): Promise<void>;
    broadcastToAllUsers(data: Omit<Partial<INotification>, 'userId'>): Promise<void>;
}
export default NotificationRepository;
//# sourceMappingURL=NotificationRepository.d.ts.map