import { Request, Response, NextFunction } from 'express';
import { MatchService } from '../services/MatchService';
import { Logger } from '../helpers/logger';

export class MatchController {
    private service: MatchService;

    constructor(service?: MatchService) {
        this.service = service || new MatchService();
    }

    public createMatch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const match = await this.service.createMatch(req.body);
            res.status(201).json({ success: true, data: match, message: 'Match created successfully' });
        } catch (error) {
            Logger.error('[MatchController] Error creating match:', error);
            next(error);
        }
    };

    public getMatchById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const match = await this.service.getMatchById(req.params.id);
            if (!match) { res.status(404).json({ success: false, error: 'Match not found' }); return; }
            res.json({ success: true, data: match });
        } catch (error) {
            next(error);
        }
    };

    public getMatchByMatchId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const match = await this.service.getMatchByMatchId(req.params.matchId);
            if (!match) { res.status(404).json({ success: false, error: 'Match not found' }); return; }
            res.json({ success: true, data: match });
        } catch (error) {
            next(error);
        }
    };

    public getMatchesByGameId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            const matches = await this.service.getMatchesByGameId(req.params.gameId, page, limit);
            res.json({ success: true, data: matches });
        } catch (error) {
            next(error);
        }
    };

    public getMatchesByPlayerName = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            const matches = await this.service.getMatchesByPlayerName(req.params.playerName, page, limit);
            res.json({ success: true, data: matches });
        } catch (error) {
            next(error);
        }
    };

    public updateMatch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const match = await this.service.updateMatch(req.params.id, req.body);
            if (!match) { res.status(404).json({ success: false, error: 'Match not found' }); return; }
            res.json({ success: true, data: match, message: 'Match updated successfully' });
        } catch (error) {
            next(error);
        }
    };

    public deleteMatch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const deleted = await this.service.deleteMatch(req.params.id);
            if (!deleted) { res.status(404).json({ success: false, error: 'Match not found' }); return; }
            res.json({ success: true, data: null, message: 'Match deleted successfully' });
        } catch (error) {
            next(error);
        }
    };

    public scoutMatches = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { gameId, characterId } = req.query;
            const limit = parseInt(req.query.limit as string) || 10;
            const matches = await this.service.scoutMatches(gameId as string, characterId as string, limit);
            res.json({ success: true, data: matches });
        } catch (error) {
            next(error);
        }
    };
}
