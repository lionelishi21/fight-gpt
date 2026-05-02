import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { IMetaService } from '../services/MetaService';
import { IIngestionService } from '../services/IngestionService';
export declare class MetaController extends BaseController {
    private readonly metaService;
    private readonly ingestionService;
    constructor(metaService: IMetaService, ingestionService: IIngestionService);
    getMetaService(): IMetaService;
    /**
     * GET /api/meta/:gameId
     * Get the latest meta report for a game
     */
    getLatestMetaReport: (req: Request, res: Response) => Promise<void>;
    /**
     * POST /api/meta/:gameId/generate
     * Trigger meta report generation for a game
     */
    generateMetaReport: (req: Request, res: Response) => Promise<void>;
    /**
     * GET /api/meta/:gameId/history
     * Get historical meta reports for a game
     */
    getMetaHistory: (req: Request, res: Response) => Promise<void>;
    /**
     * GET /api/meta/:gameId/query?q=...
     * Semantic meta query — natural language question about the meta
     */
    queryMetaInsight: (req: Request, res: Response) => Promise<void>;
    /**
     * POST /api/ingestion/trigger
     * Manually trigger video ingestion for a game
     */
    triggerIngestion: (req: Request, res: Response) => Promise<void>;
    /**
     * POST /api/ingestion/process
     * Process the pending ingestion queue
     */
    processQueue: (req: Request, res: Response) => Promise<void>;
}
//# sourceMappingURL=MetaController.d.ts.map