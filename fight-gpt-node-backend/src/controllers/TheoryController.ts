import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { ITheoryService } from '../services/TheoryService';

export class TheoryController extends BaseController {
    constructor(private readonly theoryService: ITheoryService) {
        super();
    }

    /** GET /api/theory/:gameId/characters — all character theories for a game */
    getAllCharacterTheories = async (req: Request, res: Response): Promise<void> => {
        try {
            const result = await this.theoryService.getAllCharacterTheories(req.params.gameId);
            this.sendResponse(res, result);
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Unknown error');
        }
    };

    /** GET /api/theory/:gameId/characters/:characterId */
    getCharacterTheory = async (req: Request, res: Response): Promise<void> => {
        try {
            const { gameId, characterId } = req.params;
            const { skillLevel } = req.query;
            const result = await this.theoryService.getCharacterTheory(gameId, characterId, skillLevel as any);
            this.sendResponse(res, result);
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Unknown error');
        }
    };

    /** POST /api/theory/:gameId/characters/:characterId/generate */
    generateCharacterTheory = async (req: Request, res: Response): Promise<void> => {
        try {
            const { gameId, characterId } = req.params;
            const result = await this.theoryService.generateCharacterTheory(gameId, characterId);
            this.sendResponse(res, result);
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Unknown error');
        }
    };

    /** GET /api/theory/:gameId/matchups/:charA/vs/:charB */
    getMatchupTheory = async (req: Request, res: Response): Promise<void> => {
        try {
            const { gameId, charA, charB } = req.params;
            const { skillLevel } = req.query;
            const result = await this.theoryService.getMatchupTheory(gameId, charA, charB, skillLevel as any);
            this.sendResponse(res, result);
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Unknown error');
        }
    };

    /** POST /api/theory/:gameId/matchups/:charA/vs/:charB/generate */
    generateMatchupTheory = async (req: Request, res: Response): Promise<void> => {
        try {
            const { gameId, charA, charB } = req.params;
            const result = await this.theoryService.generateMatchupTheory(gameId, charA, charB);
            this.sendResponse(res, result);
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Unknown error');
        }
    };
}
