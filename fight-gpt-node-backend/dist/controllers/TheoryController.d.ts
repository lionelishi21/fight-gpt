import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { ITheoryService } from '../services/TheoryService';
export declare class TheoryController extends BaseController {
    private readonly theoryService;
    constructor(theoryService: ITheoryService);
    /** GET /api/theory/:gameId/characters — all character theories for a game */
    getAllCharacterTheories: (req: Request, res: Response) => Promise<void>;
    /** GET /api/theory/:gameId/characters/:characterId */
    getCharacterTheory: (req: Request, res: Response) => Promise<void>;
    /** POST /api/theory/:gameId/characters/:characterId/generate */
    generateCharacterTheory: (req: Request, res: Response) => Promise<void>;
    /** GET /api/theory/:gameId/matchups/:charA/vs/:charB */
    getMatchupTheory: (req: Request, res: Response) => Promise<void>;
    /** POST /api/theory/:gameId/matchups/:charA/vs/:charB/generate */
    generateMatchupTheory: (req: Request, res: Response) => Promise<void>;
}
//# sourceMappingURL=TheoryController.d.ts.map