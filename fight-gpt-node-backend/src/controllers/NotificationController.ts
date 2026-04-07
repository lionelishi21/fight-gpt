import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { INotificationRepository } from '../repositories/NotificationRepository';

export class NotificationController extends BaseController {
    constructor(private readonly notificationRepository: INotificationRepository) {
        super();
    }

    public getMyNotifications = async (req: Request, res: Response): Promise<void> => {
        try {
            // @ts-ignore
            const userId = req.user.id;
            const limit = parseInt(req.query.limit as string) || 20;

            const notifications = await this.notificationRepository.getNotificationsByUserId(userId, limit);

            this.sendResponse(res, {
                success: true,
                data: notifications,
            });
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to fetch notifications', 500);
        }
    };

    public markAsRead = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const notification = await this.notificationRepository.markAsRead(id);

            if (!notification) {
                this.sendError(res, 'Notification not found', 404);
                return;
            }

            this.sendResponse(res, {
                success: true,
                data: notification,
            });
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to mark notification as read', 500);
        }
    };
}

export default NotificationController;
