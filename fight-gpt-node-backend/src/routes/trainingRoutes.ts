import { Router } from 'express';
import { TrainingController } from '../controllers/TrainingController';
import { authMiddleware } from '../middleware/auth';

export class TrainingRoutes {
    private router: Router;
    private controller: TrainingController;

    constructor() {
        this.router = Router();
        this.controller = new TrainingController();
        this.setupRoutes();
    }

    private setupRoutes(): void {
        // Protected routes
        // @ts-ignore
        this.router.get('/missions/badge', authMiddleware, this.controller.getMissionBadge);
        // @ts-ignore
        this.router.get('/missions', authMiddleware, this.controller.getMissions);
        // @ts-ignore
        this.router.get('/missions/:id', authMiddleware, this.controller.getMissionDetails);
        // @ts-ignore
        this.router.get('/plan', authMiddleware, this.controller.getMissions);
        // @ts-ignore
        this.router.post('/missions/:id/complete', authMiddleware, this.controller.completeMission);
        // @ts-ignore
        this.router.post('/missions/:id/proof', authMiddleware, this.controller.submitMissionProof);
    }

    public getRouter(): Router {
        return this.router;
    }
}
