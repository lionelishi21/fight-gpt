import { Request, Response } from 'express';
import { ITournamentService } from '../services/TournamentService';

export class TournamentController {
    constructor(private readonly tournamentService: ITournamentService) {}

    getUpcoming = async (req: Request, res: Response): Promise<void> => {
        const gameId = req.query.game_id as string | undefined;
        const result = await this.tournamentService.getUpcoming(gameId);
        res.json(result);
    };

    getCompleted = async (req: Request, res: Response): Promise<void> => {
        const gameId = req.query.game_id as string | undefined;
        const result = await this.tournamentService.getCompleted(gameId);
        res.json(result);
    };

    getResults = async (req: Request, res: Response): Promise<void> => {
        const { id } = req.params;
        const result = await this.tournamentService.getResults(id);
        if (!result.success) {
            res.status(404).json(result);
            return;
        }
        res.json(result);
    };

    syncFromStartGg = async (req: Request, res: Response): Promise<void> => {
        const { game_ids } = req.body;
        const result = await this.tournamentService.syncFromStartGg(game_ids);
        res.json(result);
    };

    syncResults = async (req: Request, res: Response): Promise<void> => {
        const { id } = req.params;
        const result = await this.tournamentService.syncResults(id);
        res.json(result);
    };

    queueVods = async (req: Request, res: Response): Promise<void> => {
        const { id } = req.params;
        const result = await this.tournamentService.queueTournamentVods(id);
        res.json(result);
    };
}
