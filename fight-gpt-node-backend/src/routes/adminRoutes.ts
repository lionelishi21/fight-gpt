import { Router } from 'express';
import { AdminController } from '../controllers/AdminController';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

export class AdminRoutes {
    private router: Router;

    constructor(private readonly adminController: AdminController) {
        this.router = Router();
        this.setupRoutes();
    }

    private setupRoutes(): void {
        // All routes here are protected by adminMiddleware
        this.router.use(authMiddleware);
        this.router.use(adminMiddleware);

        // Stats & Monitoring
        this.router.get('/stats', this.adminController.getSystemStats);

        // Data Management
        this.router.get('/analyses', this.adminController.getRecentAnalyses);
        this.router.delete('/analyses/:id', this.adminController.deleteAnalysis);

        // Job Management
        this.router.get('/jobs', this.adminController.getRecentJobs);
        this.router.post('/jobs/retry', this.adminController.retryJob);

        // Manual Intervention
        this.router.post('/ingestion/trigger', this.adminController.triggerManualUrl);
    }

    public getRouter(): Router {
        return this.router;
    }
}
