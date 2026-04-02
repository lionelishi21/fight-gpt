import { Router } from 'express';
import { TheoryController } from '../controllers/TheoryController';

export class TheoryRoutes {
    private router: Router;

    constructor(private readonly theoryController: TheoryController) {
        this.router = Router();
        this.setupRoutes();
    }

    private setupRoutes(): void {
        // Character theory
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
