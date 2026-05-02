"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrainingRoutes = void 0;
const express_1 = require("express");
const TrainingController_1 = require("../controllers/TrainingController");
const auth_1 = require("../middleware/auth");
class TrainingRoutes {
    router;
    controller;
    constructor() {
        this.router = (0, express_1.Router)();
        this.controller = new TrainingController_1.TrainingController();
        this.setupRoutes();
    }
    setupRoutes() {
        // Protected routes
        // @ts-ignore
        this.router.get('/missions', auth_1.authMiddleware, this.controller.getMissions);
        // @ts-ignore
        this.router.get('/missions/:id', auth_1.authMiddleware, this.controller.getMissionDetails);
        // @ts-ignore
        this.router.get('/plan', auth_1.authMiddleware, this.controller.getMissions);
        // @ts-ignore
        this.router.post('/missions/:id/complete', auth_1.authMiddleware, this.controller.completeMission);
    }
    getRouter() {
        return this.router;
    }
}
exports.TrainingRoutes = TrainingRoutes;
//# sourceMappingURL=trainingRoutes.js.map