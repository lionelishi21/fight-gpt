"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthRoutes = void 0;
const express_1 = require("express");
/**
 * Health routes
 * Follows Single Responsibility Principle - handles routing for health endpoints
 */
class HealthRoutes {
    router;
    controller;
    constructor(controller) {
        this.router = (0, express_1.Router)();
        this.controller = controller;
        this.setupRoutes();
    }
    /**
     * Setup routes
     */
    setupRoutes() {
        // GET /api/health - Health check
        this.router.get('/', (req, res) => this.controller.checkHealth(req, res));
    }
    /**
     * Get router instance
     */
    getRouter() {
        return this.router;
    }
}
exports.HealthRoutes = HealthRoutes;
//# sourceMappingURL=healthRoutes.js.map