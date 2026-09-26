import { Router } from 'express';
import { LobbyController } from '../controllers/LobbyController';
import { authMiddleware } from '../middleware/auth';

export class LobbyRoutes {
    private router: Router;
    private lobbyController: LobbyController;

    constructor() {
        this.router = Router();
        this.lobbyController = new LobbyController();
        this.setupRoutes();
    }

    private setupRoutes(): void {
        this.router.get('/', authMiddleware, (req, res) => this.lobbyController.getLobbies(req, res));
        this.router.get('/:id/history', authMiddleware, (req, res) => this.lobbyController.getHistory(req, res));
        this.router.post('/ensure', authMiddleware, (req, res) => this.lobbyController.ensureLobby(req, res));
    }

    public getRouter(): Router {
        return this.router;
    }
}
