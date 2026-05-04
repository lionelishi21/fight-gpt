"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IngestionRoutes = exports.MetaRoutes = void 0;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
class MetaRoutes {
    metaController;
    router;
    constructor(metaController) {
        this.metaController = metaController;
        this.router = (0, express_1.Router)();
        this.setupRoutes();
    }
    setupRoutes() {
        // Meta intelligence routes
        this.router.get('/:gameId', this.metaController.getLatestMetaReport);
        this.router.post('/:gameId/generate', this.metaController.generateMetaReport);
        // Gated premium routes
        this.router.get('/:gameId/history', auth_1.authMiddleware, auth_1.premiumMiddleware, this.metaController.getMetaHistory);
        this.router.get('/:gameId/query', auth_1.authMiddleware, auth_1.premiumMiddleware, this.metaController.queryMetaInsight);
    }
    getRouter() {
        return this.router;
    }
    getController() {
        return this.metaController;
    }
}
exports.MetaRoutes = MetaRoutes;
class IngestionRoutes {
    metaController;
    router;
    constructor(metaController) {
        this.metaController = metaController;
        this.router = (0, express_1.Router)();
        this.setupRoutes();
    }
    setupRoutes() {
        this.router.post('/trigger', this.metaController.triggerIngestion);
        this.router.post('/process', this.metaController.processQueue);
    }
    getRouter() {
        return this.router;
    }
}
exports.IngestionRoutes = IngestionRoutes;
//# sourceMappingURL=metaRoutes.js.map