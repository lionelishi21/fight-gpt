"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GamificationRoutes = void 0;
const express_1 = require("express");
const GamificationController_1 = require("../controllers/GamificationController");
const auth_1 = require("../middleware/auth");
class GamificationRoutes {
    router;
    controller;
    constructor() {
        this.router = (0, express_1.Router)();
        this.controller = new GamificationController_1.GamificationController();
        this.setupRoutes();
    }
    setupRoutes() {
        // Protected routes
        // @ts-ignore
        this.router.get('/stats', auth_1.authMiddleware, this.controller.getMyStats);
        // Debug execution (admin or dev only in real app, but open for now with auth)
        // @ts-ignore
        this.router.post('/debug/xp', auth_1.authMiddleware, this.controller.debugAddXp);
    }
    getRouter() {
        return this.router;
    }
}
exports.GamificationRoutes = GamificationRoutes;
//# sourceMappingURL=gamificationRoutes.js.map