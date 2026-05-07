"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TheoryController = void 0;
const BaseController_1 = require("./BaseController");
class TheoryController extends BaseController_1.BaseController {
    theoryService;
    constructor(theoryService) {
        super();
        this.theoryService = theoryService;
    }
    /** GET /api/theory/:gameId/characters — all character theories for a game */
    getAllCharacterTheories = async (req, res) => {
        try {
            const result = await this.theoryService.getAllCharacterTheories(req.params.gameId);
            this.sendResponse(res, result);
        }
        catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Unknown error');
        }
    };
    /** GET /api/theory/:gameId/characters/:characterId */
    getCharacterTheory = async (req, res) => {
        try {
            const { gameId, characterId } = req.params;
            const { skillLevel } = req.query;
            const result = await this.theoryService.getCharacterTheory(gameId, characterId, skillLevel);
            this.sendResponse(res, result);
        }
        catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Unknown error');
        }
    };
    /** POST /api/theory/:gameId/characters/:characterId/generate */
    generateCharacterTheory = async (req, res) => {
        try {
            const { gameId, characterId } = req.params;
            const result = await this.theoryService.generateCharacterTheory(gameId, characterId);
            this.sendResponse(res, result);
        }
        catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Unknown error');
        }
    };
    /** GET /api/theory/:gameId/matchups/:charA/vs/:charB */
    getMatchupTheory = async (req, res) => {
        try {
            const { gameId, charA, charB } = req.params;
            const { skillLevel } = req.query;
            const result = await this.theoryService.getMatchupTheory(gameId, charA, charB, skillLevel);
            this.sendResponse(res, result);
        }
        catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Unknown error');
        }
    };
    /** POST /api/theory/:gameId/matchups/:charA/vs/:charB/generate */
    generateMatchupTheory = async (req, res) => {
        try {
            const { gameId, charA, charB } = req.params;
            const result = await this.theoryService.generateMatchupTheory(gameId, charA, charB);
            this.sendResponse(res, result);
        }
        catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Unknown error');
        }
    };
    /** GET /api/theory/:id */
    getTheoryById = async (req, res) => {
        try {
            const result = await this.theoryService.getTheoryById(req.params.id);
            this.sendResponse(res, result);
        }
        catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Unknown error');
        }
    };
}
exports.TheoryController = TheoryController;
//# sourceMappingURL=TheoryController.js.map