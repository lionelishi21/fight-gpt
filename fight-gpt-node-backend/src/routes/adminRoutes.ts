import { Router } from 'express';
import { AdminController } from '../controllers/AdminController';
import { inviteController } from '../controllers/InviteController';
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

        // User Management
        this.router.get('/users', this.adminController.getUsers);

        // Game Management
        this.router.get('/games', this.adminController.getGames);
        this.router.post('/games', this.adminController.createGame);
        this.router.put('/games/:gameId', this.adminController.updateGame);
        this.router.patch('/games/:gameId/status', this.adminController.setGameStatus);
        this.router.post('/games/:gameId/bump-patch', this.adminController.bumpEncyclopediaPatch);

        // Character Management
        this.router.get('/characters', this.adminController.getCharacters);
        this.router.post('/characters', this.adminController.createCharacter);
        this.router.patch('/characters/:id', this.adminController.updateCharacter);
        this.router.delete('/characters/:id', this.adminController.deleteCharacter);

        // Data Management
        this.router.get('/analyses', this.adminController.getRecentAnalyses);
        this.router.delete('/analyses/:id', this.adminController.deleteAnalysis);

        // Job Management
        this.router.get('/jobs', this.adminController.getRecentJobs);
        this.router.post('/jobs/retry', this.adminController.retryJob);

        // Manual Intervention
        this.router.post('/ingestion/trigger', this.adminController.triggerManualUrl);
        this.router.post('/ingestion/seed', this.adminController.seedUrls);
        this.router.post('/ingestion/seed-and-process', this.adminController.seedAndProcess);

        // Auto-Research
        this.router.post('/research/trigger', this.adminController.triggerResearch);

        // One-shot migrations
        this.router.post('/meta/backfill-characters', this.adminController.backfillScenarioCharacters);

        // Admin Invites
        this.router.post('/invites', inviteController.createAdminInvite);
        this.router.get('/invites', inviteController.listAdminInvites);
        this.router.delete('/invites/:token', inviteController.revokeInvite);
    }

    public getRouter(): Router {
        return this.router;
    }
}
