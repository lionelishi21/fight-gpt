import { Router } from 'express';
import { MetaController } from '../controllers/MetaController';
import { CharacterEncyclopediaController } from '../controllers/CharacterEncyclopediaController';
import { AnalysisController } from '../controllers/AnalysisController';

export class PublicRoutes {
  private router: Router;

  constructor(
    private analysisController: AnalysisController,
    private characterEncyclopediaController: CharacterEncyclopediaController,
    private metaController: MetaController
  ) {
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Phase 2: SEO Engine - Public endpoints without auth
    this.router.get('/meta/:gameId', this.metaController.getLatestMetaReport.bind(this.metaController));
    this.router.get('/characters/:gameId', this.characterEncyclopediaController.getEncyclopediasByGame.bind(this.characterEncyclopediaController));
    this.router.get('/analysis/:id', this.analysisController.getAnalysis.bind(this.analysisController));
  }

  public getRouter(): Router {
    return this.router;
  }
}
