import { Router } from 'express';
import { NotificationController } from '../controllers/NotificationController';
import { authMiddleware } from '../middleware/auth';

export class NotificationRoutes {
    private router: Router;

    constructor(private readonly notificationController: NotificationController) {
        this.router = Router();
        this.setupRoutes();
    }

    private setupRoutes(): void {
        // Public meta ticker endpoint
        this.router.get('/live', this.notificationController.getRecentAlerts);

        // All other notification routes require authentication
        this.router.use(authMiddleware);

        this.router.get('/',            this.notificationController.getMyNotifications);
        this.router.get('/unread-count', this.notificationController.getUnreadCount);
        this.router.patch('/read-all',   this.notificationController.markAllRead);
        this.router.patch('/:id/read',   this.notificationController.markAsRead);
        this.router.post('/push-token',  this.notificationController.registerPushToken);
    }

    public getRouter(): Router {
        return this.router;
    }
}

export default NotificationRoutes;
