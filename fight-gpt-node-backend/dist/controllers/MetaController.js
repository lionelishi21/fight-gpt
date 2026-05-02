"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetaController = void 0;
const BaseController_1 = require("./BaseController");
class MetaController extends BaseController_1.BaseController {
    metaService;
    ingestionService;
    constructor(metaService, ingestionService) {
        super();
        this.metaService = metaService;
        this.ingestionService = ingestionService;
    }
    getMetaService() {
        return this.metaService;
    }
    /**
     * GET /api/meta/:gameId
     * Get the latest meta report for a game
     */
    getLatestMetaReport = async (req, res) => {
        try {
            const { gameId } = req.params;
            const { period } = req.query;
            const result = await this.metaService.getLatestMetaReport(gameId, period);
            this.sendResponse(res, result);
        }
        catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Unknown error');
        }
    };
    /**
     * POST /api/meta/:gameId/generate
     * Trigger meta report generation for a game
     */
    generateMetaReport = async (req, res) => {
        try {
            const { gameId } = req.params;
            const { period } = req.body;
            const result = await this.metaService.generateMetaReport(gameId, period || 'weekly');
            this.sendResponse(res, result);
        }
        catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Unknown error');
        }
    };
    /**
     * GET /api/meta/:gameId/history
     * Get historical meta reports for a game
     */
    getMetaHistory = async (req, res) => {
        try {
            const { gameId } = req.params;
            const limit = parseInt(req.query.limit) || 10;
            const result = await this.metaService.getMetaReportHistory(gameId, limit);
            this.sendResponse(res, result);
        }
        catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Unknown error');
        }
    };
    /**
     * GET /api/meta/:gameId/query?q=...
     * Semantic meta query — natural language question about the meta
     */
    queryMetaInsight = async (req, res) => {
        try {
            const { gameId } = req.params;
            const { q } = req.query;
            if (!q) {
                res.status(400).json({ success: false, error: 'Query parameter "q" is required' });
                return;
            }
            const result = await this.metaService.queryMetaInsight(gameId, q);
            this.sendResponse(res, result);
        }
        catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Unknown error');
        }
    };
    /**
     * POST /api/ingestion/trigger
     * Manually trigger video ingestion for a game
     */
    triggerIngestion = async (req, res) => {
        try {
            const { game_id, max_videos } = req.body;
            if (!game_id) {
                res.status(400).json({ success: false, error: 'game_id is required' });
                return;
            }
            const result = await this.ingestionService.triggerIngestion(game_id, max_videos || 5);
            this.sendResponse(res, result);
        }
        catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Unknown error');
        }
    };
    /**
     * POST /api/ingestion/process
     * Process the pending ingestion queue
     */
    processQueue = async (req, res) => {
        try {
            const { game_id, batch_size } = req.body;
            const result = await this.ingestionService.processQueue(game_id, batch_size || 3);
            this.sendResponse(res, result);
        }
        catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Unknown error');
        }
    };
}
exports.MetaController = MetaController;
//# sourceMappingURL=MetaController.js.map