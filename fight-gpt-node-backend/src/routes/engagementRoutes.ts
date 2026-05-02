import { Router } from 'express';
import { EngagementController } from '../controllers/EngagementController';
import { authMiddleware } from '../middleware/auth';

export class EngagementRoutes {
    public router: Router;

    constructor(private readonly engagementController: EngagementController) {
        this.router = Router();
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        // Publicly viewable stats/comments
        this.router.get('/:targetId', this.engagementController.getTargetStats);

        // Protected submission
        this.router.post('/submit', authMiddleware, this.engagementController.submit);
    }
}
