"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EngagementRoutes = void 0;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
class EngagementRoutes {
    engagementController;
    router;
    constructor(engagementController) {
        this.engagementController = engagementController;
        this.router = (0, express_1.Router)();
        this.initializeRoutes();
    }
    initializeRoutes() {
        // Publicly viewable stats/comments
        this.router.get('/:targetId', this.engagementController.getTargetStats);
        // Protected submission
        this.router.post('/submit', auth_1.authMiddleware, this.engagementController.submit);
    }
}
exports.EngagementRoutes = EngagementRoutes;
//# sourceMappingURL=engagementRoutes.js.map