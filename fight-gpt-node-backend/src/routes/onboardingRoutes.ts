import { Router } from 'express';
import { OnboardingController } from '../controllers/onboardingController';
import { authMiddleware } from '../middleware/auth';

export class OnboardingRoutes {
    private router: Router;
    private controller: OnboardingController;

    constructor() {
        this.router = Router();
        this.controller = new OnboardingController();
        this.setupRoutes();
    }

    private setupRoutes(): void {
        // Protected routes
        // @ts-ignore
        this.router.post('/complete', authMiddleware, this.controller.completeOnboarding);
    }

    public getRouter(): Router {
        return this.router;
    }
}
