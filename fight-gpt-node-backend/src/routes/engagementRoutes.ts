import { Router } from 'express';
import { EngagementController } from '../controllers/EngagementController';
import { authMiddleware } from '../middleware/auth';

export class EngagementRoutes {
    private router: Router;
    private controller: EngagementController;

    constructor() {
        this.router = Router();
        this.controller = new EngagementController();
        this.setupRoutes();
    }

    private setupRoutes(): void {
        this.router.post('/submit', authMiddleware, this.controller.submit);
        this.router.get('/:targetId', authMiddleware, this.controller.getStats);
    }

    public getRouter(): Router {
        return this.router;
    }
}
