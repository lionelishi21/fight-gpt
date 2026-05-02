"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthRoutes = void 0;
const express_1 = require("express");
const AuthController_1 = require("../controllers/AuthController");
const auth_1 = require("../middleware/auth");
class AuthRoutes {
    router;
    authController;
    constructor() {
        this.router = (0, express_1.Router)();
        this.authController = new AuthController_1.AuthController();
        this.setupRoutes();
    }
    setupRoutes() {
        // Public routes
        this.router.post('/register', this.authController.register);
        this.router.post('/login', this.authController.login);
        // Protected routes
        this.router.get('/me', auth_1.authMiddleware, this.authController.getMe);
        this.router.put('/profile', auth_1.authMiddleware, this.authController.updateProfile);
        this.router.put('/preferences', auth_1.authMiddleware, this.authController.updatePreferences);
        // Internal route — called by Stripe webhook (protected by INTERNAL_WEBHOOK_SECRET)
        this.router.post('/internal/update-tier', this.authController.updateTierFromStripe);
    }
    getRouter() {
        return this.router;
    }
}
exports.AuthRoutes = AuthRoutes;
//# sourceMappingURL=authRoutes.js.map