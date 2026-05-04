import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { INotificationRepository } from '../repositories/NotificationRepository';
export declare class NotificationController extends BaseController {
    private readonly notificationRepository;
    constructor(notificationRepository: INotificationRepository);
    getMyNotifications: (req: Request, res: Response) => Promise<void>;
    getUnreadCount: (req: Request, res: Response) => Promise<void>;
    markAsRead: (req: Request, res: Response) => Promise<void>;
    markAllRead: (req: Request, res: Response) => Promise<void>;
    registerPushToken: (req: Request, res: Response) => Promise<void>;
}
export default NotificationController;
//# sourceMappingURL=NotificationController.d.ts.map