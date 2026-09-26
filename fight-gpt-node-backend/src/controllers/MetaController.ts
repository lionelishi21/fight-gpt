import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { IMetaService } from '../services/MetaService';
import { IIngestionService } from '../services/IngestionService';

export class MetaController extends BaseController {
    constructor(
        private readonly metaService: IMetaService,
        private readonly ingestionService: IIngestionService,
    ) {
        super();
    }

    public getMetaService(): IMetaService {
        return this.metaService;
    }

    /**
     * GET /api/meta/:gameId
     * Get the latest meta report for a game
     */
    getLatestMetaReport = async (req: Request, res: Response): Promise<void> => {
        try {
            const { gameId } = req.params;
            const { period } = req.query as { period?: string };
            const result = await this.metaService.getLatestMetaReport(gameId, period);
            this.sendResponse(res, result);
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Unknown error');
        }
    };

    /**
     * POST /api/meta/:gameId/generate
     * Trigger meta report generation for a game
     */
    generateMetaReport = async (req: Request, res: Response): Promise<void> => {
        try {
            const { gameId } = req.params;
            const { period } = req.body as { period?: 'weekly' | 'patch' | 'monthly' };
            const result = await this.metaService.generateMetaReport(gameId, period || 'weekly');
            this.sendResponse(res, result);
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Unknown error');
        }
    };

    /**
     * GET /api/meta/:gameId/history
     * Get historical meta reports for a game
     */
    getMetaHistory = async (req: Request, res: Response): Promise<void> => {
        try {
            const { gameId } = req.params;
            const limit = parseInt(req.query.limit as string) || 10;
            const result = await this.metaService.getMetaReportHistory(gameId, limit);
            this.sendResponse(res, result);
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Unknown error');
        }
    };

    /**
     * GET /api/meta/:gameId/query?q=...
     * Semantic meta query — natural language question about the meta
     */
    queryMetaInsight = async (req: Request, res: Response): Promise<void> => {
        try {
            const { gameId } = req.params;
            const { q } = req.query as { q?: string };
            if (!q) {
                res.status(400).json({ success: false, error: 'Query parameter "q" is required' });
                return;
            }
            const result = await this.metaService.queryMetaInsight(gameId, q);
            this.sendResponse(res, result);
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Unknown error');
        }
    };

    /**
     * POST /api/ingestion/trigger
     * Manually trigger video ingestion for a game
     */
    triggerIngestion = async (req: Request, res: Response): Promise<void> => {
        try {
            const { game_id, max_videos } = req.body as { game_id: string; max_videos?: number };
            if (!game_id) {
                res.status(400).json({ success: false, error: 'game_id is required' });
                return;
            }
            const result = await this.ingestionService.triggerIngestion(game_id, max_videos || 5);
            this.sendResponse(res, result);
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Unknown error');
        }
    };

    /**
     * POST /api/ingestion/process
     * Process the pending ingestion queue
     */
    processQueue = async (req: Request, res: Response): Promise<void> => {
        try {
            const { game_id, batch_size } = req.body as { game_id?: string; batch_size?: number };
            const result = await this.ingestionService.processQueue(game_id, batch_size || 3);
            this.sendResponse(res, result);
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Unknown error');
        }
    };
    /**
     * GET /api/ingestion/feed?gameId=sf6&limit=30
     * What the analysis pipeline has been working on, plus queue totals.
     */
    getIngestionFeed = async (req: Request, res: Response): Promise<void> => {
        try {
            const gameId = typeof req.query.gameId === 'string' && req.query.gameId ? req.query.gameId.toLowerCase() : undefined;
            const limit = req.query.limit ? parseInt(String(req.query.limit), 10) || 30 : 30;
            const result = await this.ingestionService.getFeed(gameId, limit);
            this.sendResponse(res, result);
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Unknown error');
        }
    };
}
