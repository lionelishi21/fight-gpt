import { Router } from 'express';
import { GamificationController } from '../controllers/GamificationController';
import { authMiddleware } from '../middleware/auth';

export class GamificationRoutes {
    private router: Router;
    private controller: GamificationController;

    constructor() {
        this.router = Router();
        this.controller = new GamificationController();
        this.setupRoutes();
    }

    private setupRoutes(): void {
        this.router.get('/stats', authMiddleware, this.controller.getStats);
    }

    public getRouter(): Router {
        return this.router;
    }
}
