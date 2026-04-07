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
        // All notification routes require authentication
        this.router.use(authMiddleware);

        this.router.get('/', this.notificationController.getMyNotifications);
        this.router.patch('/:id/read', this.notificationController.markAsRead);
    }

    public getRouter(): Router {
        return this.router;
    }
}

export default NotificationRoutes;
