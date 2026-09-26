import { Request, Response } from 'express';
import { LobbyService } from '../services/LobbyService';

export class LobbyController {
    private lobbyService: LobbyService;

    constructor() {
        this.lobbyService = new LobbyService();
    }

    /**
     * Get all lobbies
     */
    public async getLobbies(req: Request, res: Response): Promise<void> {
        try {
            const gameId = req.query.gameId as string;
            const lobbies = await this.lobbyService.getLobbies(gameId);
            res.json({ success: true, data: lobbies });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Get lobby history
     */
    public async getHistory(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
            const history = await this.lobbyService.getHistory(id, limit);
            res.json({ success: true, data: history });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Ensure a lobby exists (internal/admin)
     */
    public async ensureLobby(req: Request, res: Response): Promise<void> {
        try {
            const { gameId, name } = req.body;
            const lobby = await this.lobbyService.ensureLobby(gameId, name);
            res.json({ success: true, data: lobby });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}
