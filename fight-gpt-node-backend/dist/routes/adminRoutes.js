"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminRoutes = void 0;
const express_1 = require("express");
const InviteController_1 = require("../controllers/InviteController");
const auth_1 = require("../middleware/auth");
class AdminRoutes {
    adminController;
    router;
    constructor(adminController) {
        this.adminController = adminController;
        this.router = (0, express_1.Router)();
        this.setupRoutes();
    }
    setupRoutes() {
        // All routes here are protected by adminMiddleware
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
        // Search Strategy Management (DB-driven ingestion queries)
        this.router.get('/games/:gameId/search-strategies', this.adminController.getSearchStrategies);
        this.router.post('/games/:gameId/search-strategies', this.adminController.upsertSearchStrategies);
        this.router.delete('/games/:gameId/search-strategies/:id', this.adminController.deactivateSearchStrategy);
        // Admin Invites
        this.router.post('/invites', InviteController_1.inviteController.createAdminInvite);
        this.router.get('/invites', InviteController_1.inviteController.listAdminInvites);
        this.router.delete('/invites/:token', InviteController_1.inviteController.revokeInvite);
    }
    getRouter() {
        return this.router;
    }
}
exports.AdminRoutes = AdminRoutes;
//# sourceMappingURL=adminRoutes.js.map