"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRoutes = void 0;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
class UserRoutes {
    userController;
    router;
    constructor(userController) {
        this.userController = userController;
        this.router = (0, express_1.Router)();
        this.setupRoutes();
    }
    setupRoutes() {
        // All user routes are protected
        this.router.get('/me', auth_1.authMiddleware, this.userController.getMe);
        this.router.patch('/slots/active', auth_1.authMiddleware, this.userController.switchActiveSlot);
        this.router.patch('/slots/:index', auth_1.authMiddleware, this.userController.updateSlot);
        this.router.post('/push-token', auth_1.authMiddleware, this.userController.registerPushToken);
        this.router.get('/leaderboard', auth_1.authMiddleware, this.userController.getLeaderboard);
    }
    getRouter() {
        return this.router;
    }
}
exports.UserRoutes = UserRoutes;
exports.default = UserRoutes;
//# sourceMappingURL=userRoutes.js.map