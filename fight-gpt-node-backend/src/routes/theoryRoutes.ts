import { Router } from 'express';
import { TheoryController } from '../controllers/TheoryController';
import { authMiddleware, premiumMiddleware } from '../middleware/auth';

export class TheoryRoutes {
    private router: Router;

    constructor(private readonly theoryController: TheoryController) {
        this.router = Router();
        this.setupRoutes();
    }

    private setupRoutes(): void {
        // All theory routes are premium
        this.router.use(authMiddleware);
        this.router.use(premiumMiddleware);

        // Direct ID lookup
        this.router.get('/id/:id', this.theoryController.getTheoryById);

        // Character theory
        this.router.get('/:gameId', this.theoryController.getAllCharacterTheories);
        this.router.get('/:gameId/characters', this.theoryController.getAllCharacterTheories);
        this.router.get('/:gameId/characters/:characterId', this.theoryController.getCharacterTheory);
        this.router.post('/:gameId/characters/:characterId/generate', this.theoryController.generateCharacterTheory);

        // Matchup theory
        this.router.get('/:gameId/matchups/:charA/vs/:charB', this.theoryController.getMatchupTheory);
        this.router.post('/:gameId/matchups/:charA/vs/:charB/generate', this.theoryController.generateMatchupTheory);
    }

    public getRouter(): Router {
        return this.router;
    }
}
