import { Request, Response, NextFunction } from 'express';
import { MatchService } from '../services/MatchService';
export declare class MatchController {
    private service;
    constructor(service?: MatchService);
    createMatch: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getMatchById: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getMatchByMatchId: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getMatchesByGameId: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getMatchesByPlayerName: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    updateMatch: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    deleteMatch: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}
//# sourceMappingURL=MatchController.d.ts.map