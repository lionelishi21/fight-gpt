import { Router } from 'express';
import { MetaController } from '../controllers/MetaController';
import { authMiddleware, adminMiddleware, premiumMiddleware } from '../middleware/auth';

export class MetaRoutes {
    private router: Router;

    constructor(private readonly metaController: MetaController) {
        this.router = Router();
        this.setupRoutes();
    }

    private setupRoutes(): void {
        // Meta intelligence routes
        this.router.get('/:gameId', this.metaController.getLatestMetaReport);
        this.router.post('/:gameId/generate', this.metaController.generateMetaReport);
        
        // Gated premium routes
        this.router.get('/:gameId/history', authMiddleware, premiumMiddleware, this.metaController.getMetaHistory);
        this.router.get('/:gameId/query', authMiddleware, premiumMiddleware, this.metaController.queryMetaInsight);
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
        this.router.get('/feed', authMiddleware, this.metaController.getIngestionFeed);
        // These start paid video analysis; they were reachable without logging in.
        this.router.post('/trigger', authMiddleware, adminMiddleware, this.metaController.triggerIngestion);
        this.router.post('/process', authMiddleware, adminMiddleware, this.metaController.processQueue);
    }

    public getRouter(): Router {
        return this.router;
    }
}
