"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnboardingRoutes = void 0;
const express_1 = require("express");
const onboardingController_1 = require("../controllers/onboardingController");
const auth_1 = require("../middleware/auth");
class OnboardingRoutes {
    router;
    controller;
    constructor() {
        this.router = (0, express_1.Router)();
        this.controller = new onboardingController_1.OnboardingController();
        this.setupRoutes();
    }
    setupRoutes() {
        // Protected routes
        // @ts-ignore
        this.router.post('/complete', auth_1.authMiddleware, this.controller.completeOnboarding);
        // @ts-ignore
        this.router.get('/status', auth_1.authMiddleware, this.controller.getOnboardingStatus);
    }
    getRouter() {
        return this.router;
    }
}
exports.OnboardingRoutes = OnboardingRoutes;
//# sourceMappingURL=onboardingRoutes.js.map