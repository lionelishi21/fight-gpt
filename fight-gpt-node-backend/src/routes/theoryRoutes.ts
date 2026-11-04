import { Router } from 'express';
import { TheoryController } from '../controllers/TheoryController';
import { authMiddleware, premiumMiddleware, characterTheoryAccessMiddleware } from '../middleware/auth';

export class TheoryRoutes {
    private router: Router;

    constructor(private readonly theoryController: TheoryController) {
        this.router = Router();
        this.setupRoutes();
    }

    private setupRoutes(): void {
        // Theory is Pro, except that free accounts can read their own character's theory
        this.router.use(authMiddleware);
        const pro = premiumMiddleware;

        // Direct ID lookup
        this.router.get('/id/:id', pro, this.theoryController.getTheoryById);

        // Character theory
        this.router.get('/:gameId', pro, this.theoryController.getAllCharacterTheories);
        this.router.get('/:gameId/characters', pro, this.theoryController.getAllCharacterTheories);
        this.router.get('/:gameId/characters/:characterId', characterTheoryAccessMiddleware, this.theoryController.getCharacterTheory);
        this.router.post('/:gameId/characters/:characterId/generate', pro, this.theoryController.generateCharacterTheory);

        // Matchup theory
        this.router.get('/:gameId/matchups/:charA/vs/:charB', pro, this.theoryController.getMatchupTheory);
        this.router.post('/:gameId/matchups/:charA/vs/:charB/generate', pro, this.theoryController.generateMatchupTheory);
    }

    public getRouter(): Router {
        return this.router;
    }
}
