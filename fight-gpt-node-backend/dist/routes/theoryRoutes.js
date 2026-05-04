"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TheoryRoutes = void 0;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
class TheoryRoutes {
    theoryController;
    router;
    constructor(theoryController) {
        this.theoryController = theoryController;
        this.router = (0, express_1.Router)();
        this.setupRoutes();
    }
    setupRoutes() {
        // All theory routes are premium
        this.router.use(auth_1.authMiddleware);
        this.router.use(auth_1.premiumMiddleware);
        // Character theory
        this.router.get('/:gameId', this.theoryController.getAllCharacterTheories);
        this.router.get('/:gameId/characters', this.theoryController.getAllCharacterTheories);
        this.router.get('/:gameId/characters/:characterId', this.theoryController.getCharacterTheory);
        this.router.post('/:gameId/characters/:characterId/generate', this.theoryController.generateCharacterTheory);
        // Matchup theory
        this.router.get('/:gameId/matchups/:charA/vs/:charB', this.theoryController.getMatchupTheory);
        this.router.post('/:gameId/matchups/:charA/vs/:charB/generate', this.theoryController.generateMatchupTheory);
    }
    getRouter() {
        return this.router;
    }
}
exports.TheoryRoutes = TheoryRoutes;
//# sourceMappingURL=theoryRoutes.js.map