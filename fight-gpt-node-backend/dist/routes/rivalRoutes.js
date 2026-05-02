"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RivalRoutes = void 0;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
class RivalRoutes {
    rivalController;
    router;
    constructor(rivalController) {
        this.rivalController = rivalController;
        this.router = (0, express_1.Router)();
        this.setupRoutes();
    }
    setupRoutes() {
        this.router.get('/', auth_1.authMiddleware, this.rivalController.getRivals);
        this.router.post('/', auth_1.authMiddleware, this.rivalController.addRival);
        this.router.delete('/:id', auth_1.authMiddleware, this.rivalController.deleteRival);
    }
    getRouter() {
        return this.router;
    }
}
exports.RivalRoutes = RivalRoutes;
exports.default = RivalRoutes;
//# sourceMappingURL=rivalRoutes.js.map