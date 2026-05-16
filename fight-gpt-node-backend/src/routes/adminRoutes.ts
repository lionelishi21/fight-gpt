import { Router } from 'express';
import { AdminController } from '../controllers/AdminController';
import { inviteController } from '../controllers/InviteController';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { adminKeyAuth } from '../middleware/adminKeyAuth';
import multer from 'multer';

const upload = multer({ dest: 'uploads/temp/' });

export class AdminRoutes {
    private router: Router;

    constructor(private readonly adminController: AdminController) {
        this.router = Router();
        this.setupRoutes();
    }

    private setupRoutes(): void {
        // Admin routes require BOTH:
        // 1. x-admin-key header (bypasses global IP rate limiter — checked first)
        // 2. Valid JWT + admin role (standard auth chain)
        this.router.use(adminKeyAuth);
        this.router.use(authMiddleware);
        this.router.use(adminMiddleware);

        // Stats & Monitoring
        this.router.get('/stats', this.adminController.getSystemStats);

        // User Management
        this.router.get('/users', this.adminController.getUsers);

        // Game Management
        this.router.post('/games/onboard', this.adminController.onboardGame);  // one-call new game setup
        this.router.get('/games', this.adminController.getGames);
        this.router.post('/games', this.adminController.createGame);
        this.router.put('/games/:gameId', this.adminController.updateGame);
        this.router.patch('/games/:gameId/status', this.adminController.setGameStatus);
        this.router.post('/games/:gameId/bump-patch', this.adminController.bumpEncyclopediaPatch);
        this.router.post('/games/:gameId/patch', this.adminController.declarePatch);
        this.router.get('/games/:gameId/patches', this.adminController.getPatchHistory);
        this.router.post('/games/:gameId/scan', this.adminController.scanGame);
        this.router.post('/games/:gameId/deepscan', this.adminController.deepScanGame);
        this.router.post('/games/:gameId/sync', this.adminController.syncGameData);

        // Character Management
        this.router.get('/characters', this.adminController.getCharacters);
        this.router.post('/characters', this.adminController.createCharacter);
        this.router.patch('/characters/:id', this.adminController.updateCharacter);
        this.router.delete('/characters/:id', this.adminController.deleteCharacter);

        // Data Management
        this.router.get('/analyses', this.adminController.getRecentAnalyses);
        this.router.delete('/analyses/:id', this.adminController.deleteAnalysis);
        this.router.post('/analyses/:id/reanalyze', this.adminController.reanalyzeAnalysis);

        // Job Management
        this.router.get('/jobs', this.adminController.getRecentJobs);
        this.router.post('/jobs/retry', this.adminController.retryJob);

        // Manual Intervention
        this.router.post('/ingestion/trigger', this.adminController.triggerManualUrl);
        this.router.post('/ingestion/seed', this.adminController.seedUrls);
        this.router.post('/ingestion/seed-and-process', this.adminController.seedAndProcess);
        this.router.post('/ingestion/bulk-queue', this.adminController.bulkQueuePending);

        // Auto-Research
        this.router.post('/research/trigger', this.adminController.triggerResearch);
        this.router.post('/trends/analyze', this.adminController.triggerTrendAnalysis);

        // Search Strategy Management (DB-driven ingestion queries)
        this.router.get('/games/:gameId/search-strategies', this.adminController.getSearchStrategies);
        this.router.post('/games/:gameId/search-strategies', this.adminController.upsertSearchStrategies);
        this.router.delete('/games/:gameId/search-strategies/:id', this.adminController.deactivateSearchStrategy);

        // Theory Staging
        this.router.get('/theory/staging', this.adminController.getStagingTheories);
        this.router.patch('/theory/:id/status', this.adminController.updateTheoryStatus);

        // Admin Invites
        this.router.post('/invites', inviteController.createAdminInvite);
        this.router.get('/invites', inviteController.listAdminInvites);
        this.router.delete('/invites/:token', inviteController.revokeInvite);

        // System Settings
        this.router.post('/settings/cookie', upload.single('cookieFile'), this.adminController.uploadCookies);
        this.router.get('/settings/cookie/status', this.adminController.getCookieStatus);
    }

    public getRouter(): Router {
        return this.router;
    }
}
