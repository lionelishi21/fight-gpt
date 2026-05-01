import { Router } from 'express';
import { MetaController } from '../controllers/MetaController';

export class MetaRoutes {
    private router: Router;

    constructor(private readonly metaController: MetaController) {
        this.router = Router();
        this.setupRoutes();
    }

    private setupRoutes(): void {
        // One-shot migration (secret-key protected, no auth middleware)
        this.router.post('/backfill-characters', this.metaController.backfillCharacters);
        // Meta intelligence routes
        this.router.get('/:gameId', this.metaController.getLatestMetaReport);
        this.router.post('/:gameId/generate', this.metaController.generateMetaReport);
        this.router.get('/:gameId/history', this.metaController.getMetaHistory);
        this.router.get('/:gameId/query', this.metaController.queryMetaInsight);
    }

    public getRouter(): Router {
        return this.router;
    }

    public getController(): MetaController {
        return this.metaController;
    }
}

export class IngestionRoutes {
    private router: Router;

    constructor(private readonly metaController: MetaController) {
        this.router = Router();
        this.setupRoutes();
    }

    private setupRoutes(): void {
        this.router.post('/trigger', this.metaController.triggerIngestion);
        this.router.post('/process', this.metaController.processQueue);
    }

    public getRouter(): Router {
        return this.router;
    }
}
