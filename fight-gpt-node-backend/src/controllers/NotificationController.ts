import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { INotificationRepository } from '../repositories/NotificationRepository';

export class NotificationController extends BaseController {
    constructor(private readonly notificationRepository: INotificationRepository) {
        super();
    }

    public getMyNotifications = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = (req as any).user?.id || (req as any).user?._id;
            const limit = parseInt(req.query.limit as string) || 20;
            const notifications = await this.notificationRepository.getNotificationsByUserId(userId, limit);
            this.sendResponse(res, { success: true, data: notifications });
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to fetch notifications', 500);
        }
    };

    public getUnreadCount = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = (req as any).user?.id || (req as any).user?._id;
            const count = await this.notificationRepository.getUnreadCount(userId);
            this.sendResponse(res, { success: true, data: { count } });
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to fetch unread count', 500);
        }
    };

    public markAsRead = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const notification = await this.notificationRepository.markAsRead(id);
            if (!notification) { this.sendError(res, 'Notification not found', 404); return; }
            this.sendResponse(res, { success: true, data: notification });
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to mark as read', 500);
        }
    };

    public markAllRead = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = (req as any).user?.id || (req as any).user?._id;
            await this.notificationRepository.markAllRead(userId);
            this.sendResponse(res, { success: true, data: { message: 'All notifications marked as read' } });
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to mark all as read', 500);
        }
    };

    public registerPushToken = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = (req as any).user?.id || (req as any).user?._id;
            const { token } = req.body;
            
            if (!token) {
                this.sendError(res, 'Push token is required', 400);
                return;
            }

            const User = (await import('../models/User')).default;
            await User.updateOne(
                { _id: userId },
                { $addToSet: { pushTokens: token } }
            );

            this.sendResponse(res, { success: true, message: 'Push token registered successfully' });
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to register push token', 500);
        }
    };
}

export default NotificationController;
