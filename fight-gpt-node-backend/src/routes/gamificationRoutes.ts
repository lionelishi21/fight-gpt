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
        // Protected routes
        // @ts-ignore
        this.router.get('/stats', authMiddleware, this.controller.getMyStats);

        // Debug execution (admin or dev only in real app, but open for now with auth)
        // @ts-ignore
        this.router.post('/debug/xp', authMiddleware, this.controller.debugAddXp);
    }

    public getRouter(): Router {
        return this.router;
    }
}
