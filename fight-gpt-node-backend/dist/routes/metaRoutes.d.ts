import { Router } from 'express';
import { MetaController } from '../controllers/MetaController';
export declare class MetaRoutes {
    private readonly metaController;
    private router;
    constructor(metaController: MetaController);
    private setupRoutes;
    getRouter(): Router;
    getController(): MetaController;
}
export declare class IngestionRoutes {
    private readonly metaController;
    private router;
    constructor(metaController: MetaController);
    private setupRoutes;
    getRouter(): Router;
}
//# sourceMappingURL=metaRoutes.d.ts.map