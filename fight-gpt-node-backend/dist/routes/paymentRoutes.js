"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentRoutes = void 0;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
class PaymentRoutes {
    paymentController;
    router;
    constructor(paymentController) {
        this.paymentController = paymentController;
        this.router = (0, express_1.Router)();
        this.setupRoutes();
    }
    setupRoutes() {
        // Create checkout session (Authenticated)
        this.router.post('/create-session', auth_1.authMiddleware, this.paymentController.createSession);
        // Webhook (Public, but verified via Stripe signature)
        // IMPORTANT: Must be configured in index.ts with express.raw()
        this.router.post('/webhook', this.paymentController.webhook);
    }
    getRouter() {
        return this.router;
    }
}
exports.PaymentRoutes = PaymentRoutes;
//# sourceMappingURL=paymentRoutes.js.map