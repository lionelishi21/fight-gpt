"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminRoutes = void 0;
const express_1 = require("express");
const InviteController_1 = require("../controllers/InviteController");
const auth_1 = require("../middleware/auth");
const adminKeyAuth_1 = require("../middleware/adminKeyAuth");
const multer_1 = __importDefault(require("multer"));
const upload = (0, multer_1.default)({ dest: 'uploads/temp/' });
class AdminRoutes {
    adminController;
    router;
    constructor(adminController) {
        this.adminController = adminController;
        this.router = (0, express_1.Router)();
        this.setupRoutes();
    }
    setupRoutes() {
        // Admin routes require BOTH:
        // 1. x-admin-key header (bypasses global IP rate limiter — checked first)
        // 2. Valid JWT + admin role (standard auth chain)
        this.router.use(adminKeyAuth_1.adminKeyAuth);
        this.router.use(auth_1.authMiddleware);
        this.router.use(auth_1.adminMiddleware);
        // Stats & Monitoring
        this.router.get('/stats', this.adminController.getSystemStats);
        // User Management
        this.router.get('/users', this.adminController.getUsers);
        // Game Management
        this.router.post('/games/onboard', this.adminController.onboardGame); // one-call new game setup
        this.router.get('/games', this.adminController.getGames);
        this.router.post('/games', this.adminController.createGame);
        this.router.put('/games/:gameId', this.adminController.updateGame);
        this.router.patch('/games/:gameId/status', this.adminController.setGameStatus);
        this.router.post('/games/:gameId/bump-patch', this.adminController.bumpEncyclopediaPatch);
        this.router.post('/games/:gameId/patch', this.adminController.declarePatch);
        this.router.get('/games/:gameId/patches', this.adminController.getPatchHistory);
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
        this.router.post('/invites', InviteController_1.inviteController.createAdminInvite);
        this.router.get('/invites', InviteController_1.inviteController.listAdminInvites);
        this.router.delete('/invites/:token', InviteController_1.inviteController.revokeInvite);
        // System Settings
        this.router.post('/settings/cookie', upload.single('cookieFile'), this.adminController.uploadCookies);
    }
    getRouter() {
        return this.router;
    }
}
exports.AdminRoutes = AdminRoutes;
//# sourceMappingURL=adminRoutes.js.map