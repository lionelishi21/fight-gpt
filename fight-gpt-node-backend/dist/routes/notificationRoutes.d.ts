import { Router } from 'express';
import { NotificationController } from '../controllers/NotificationController';
export declare class NotificationRoutes {
    private readonly notificationController;
    private router;
    constructor(notificationController: NotificationController);
    private setupRoutes;
    getRouter(): Router;
}
export default NotificationRoutes;
//# sourceMappingURL=notificationRoutes.d.ts.map