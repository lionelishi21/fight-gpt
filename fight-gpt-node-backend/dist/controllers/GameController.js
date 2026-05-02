"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameController = void 0;
const BaseController_1 = require("./BaseController");
/**
 * Game controller implementation
 * Follows Single Responsibility Principle - handles HTTP requests/responses for games
 * Follows Dependency Inversion Principle - depends on service interface
 */
class GameController extends BaseController_1.BaseController {
    gameService;
    auditLogRepository;
    constructor(gameService, auditLogRepository) {
        super();
        this.gameService = gameService;
        this.auditLogRepository = auditLogRepository;
    }
    /**
     * Create game endpoint handler
     * POST /api/games
     */
    async createGame(req, res, next) {
        const requestId = this.getRequestId(req);
        const startTime = Date.now();
        try {
            const request = req.body;
            const result = await this.gameService.createGame(request);
            const responseTime = Date.now() - startTime;
            await this.auditLogRepository.createAuditLog({
                request_id: requestId,
                endpoint: '/api/games',
                method: 'POST',
                ip_address: req.ip,
                user_agent: req.headers['user-agent'],
                request_body: request,
                response_status: result.success ? 201 : 400,
                response_time_ms: responseTime,
            });
            const statusCode = result.success ? 201 : 400;
            this.sendResponse(res, result, statusCode);
        }
        catch (error) {
            const responseTime = Date.now() - startTime;
            await this.auditLogRepository.createAuditLog({
                request_id: requestId,
                endpoint: '/api/games',
                method: 'POST',
                ip_address: req.ip,
                user_agent: req.headers['user-agent'],
                request_body: req.body,
                response_status: 500,
                response_time_ms: responseTime,
                error_message: error instanceof Error ? error.message : 'Unknown error',
            }).catch((err) => {
                console.error('[GameController] Failed to create audit log:', err);
            });
            this.handleError(error, req, res, next);
        }
    }
    /**
     * Get game by ID endpoint handler
     * GET /api/games/:id
     */
    async getGameById(req, res, next) {
        const requestId = this.getRequestId(req);
        const startTime = Date.now();
        try {
            const { id } = req.params;
            if (!id) {
                this.sendResponse(res, { success: false, error: 'Game ID is required' }, 400);
                return;
            }
            const result = await this.gameService.getGameById(id);
            const responseTime = Date.now() - startTime;
            await this.auditLogRepository.createAuditLog({
                request_id: requestId,
                endpoint: `/api/games/${id}`,
                method: 'GET',
                ip_address: req.ip,
                user_agent: req.headers['user-agent'],
                response_status: result.success ? 200 : 404,
                response_time_ms: responseTime,
            });
            const statusCode = result.success ? 200 : 404;
            this.sendResponse(res, result, statusCode);
        }
        catch (error) {
            this.handleError(error, req, res, next);
        }
    }
    /**
     * Get game by game_id endpoint handler
     * GET /api/games/game-id/:gameId
     */
    async getGameByGameId(req, res, next) {
        try {
            const { gameId } = req.params;
            if (!gameId) {
                this.sendResponse(res, { success: false, error: 'Game ID is required' }, 400);
                return;
            }
            const result = await this.gameService.getGameByGameId(gameId);
            const statusCode = result.success ? 200 : 404;
            this.sendResponse(res, result, statusCode);
        }
        catch (error) {
            this.handleError(error, req, res, next);
        }
    }
    /**
     * Update game endpoint handler
     * PUT /api/games/:id
     */
    async updateGame(req, res, next) {
        const requestId = this.getRequestId(req);
        const startTime = Date.now();
        try {
            const { id } = req.params;
            const request = req.body;
            if (!id) {
                this.sendResponse(res, { success: false, error: 'Game ID is required' }, 400);
                return;
            }
            const result = await this.gameService.updateGame(id, request);
            const responseTime = Date.now() - startTime;
            await this.auditLogRepository.createAuditLog({
                request_id: requestId,
                endpoint: `/api/games/${id}`,
                method: 'PUT',
                ip_address: req.ip,
                user_agent: req.headers['user-agent'],
                request_body: request,
                response_status: result.success ? 200 : 404,
                response_time_ms: responseTime,
            });
            const statusCode = result.success ? 200 : 404;
            this.sendResponse(res, result, statusCode);
        }
        catch (error) {
            this.handleError(error, req, res, next);
        }
    }
    /**
     * Update game by game_id endpoint handler
     * PUT /api/games/game-id/:gameId
     */
    async updateGameByGameId(req, res, next) {
        try {
            const { gameId } = req.params;
            const request = req.body;
            if (!gameId) {
                this.sendResponse(res, { success: false, error: 'Game ID is required' }, 400);
                return;
            }
            const result = await this.gameService.updateGameByGameId(gameId, request);
            const statusCode = result.success ? 200 : 404;
            this.sendResponse(res, result, statusCode);
        }
        catch (error) {
            this.handleError(error, req, res, next);
        }
    }
    /**
     * Delete game endpoint handler
     * DELETE /api/games/:id
     */
    async deleteGame(req, res, next) {
        const requestId = this.getRequestId(req);
        const startTime = Date.now();
        try {
            const { id } = req.params;
            if (!id) {
                this.sendResponse(res, { success: false, error: 'Game ID is required' }, 400);
                return;
            }
            const result = await this.gameService.deleteGame(id);
            const responseTime = Date.now() - startTime;
            await this.auditLogRepository.createAuditLog({
                request_id: requestId,
                endpoint: `/api/games/${id}`,
                method: 'DELETE',
                ip_address: req.ip,
                user_agent: req.headers['user-agent'],
                response_status: result.success ? 200 : 404,
                response_time_ms: responseTime,
            });
            const statusCode = result.success ? 200 : 404;
            this.sendResponse(res, result, statusCode);
        }
        catch (error) {
            this.handleError(error, req, res, next);
        }
    }
    /**
     * Get active games endpoint handler (for onboarding)
     * GET /api/games/active
     */
    async getActiveGames(req, res, next) {
        try {
            const result = await this.gameService.getActiveGames();
            this.sendResponse(res, result, result.success ? 200 : 400);
        }
        catch (error) {
            this.handleError(error, req, res, next);
        }
    }
    /**
     * Find games with filters endpoint handler
     * GET /api/games?gameId=...&name=...&publisher=...&isActive=...
     */
    async findGames(req, res, next) {
        try {
            const filters = {
                game_id: req.query.gameId,
                name: req.query.name,
                publisher: req.query.publisher,
                developer: req.query.developer,
                genre: req.query.genre,
                platform: req.query.platform,
                is_active: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
            };
            const limit = req.query.limit ? parseInt(req.query.limit, 10) : undefined;
            const result = await this.gameService.findGames(filters, limit);
            this.sendResponse(res, result, result.success ? 200 : 400);
        }
        catch (error) {
            this.handleError(error, req, res, next);
        }
    }
    /**
     * Search games endpoint handler
     * GET /api/games/search?q=query
     */
    async searchGames(req, res, next) {
        try {
            const { q } = req.query;
            if (!q || typeof q !== 'string') {
                this.sendResponse(res, { success: false, error: 'Search query (q) is required' }, 400);
                return;
            }
            const result = await this.gameService.searchGames(q);
            this.sendResponse(res, result, result.success ? 200 : 400);
        }
        catch (error) {
            this.handleError(error, req, res, next);
        }
    }
    /**
     * Activate game endpoint handler
     * PATCH /api/games/:id/activate
     */
    async activateGame(req, res, next) {
        try {
            const { id } = req.params;
            if (!id) {
                this.sendResponse(res, { success: false, error: 'Game ID is required' }, 400);
                return;
            }
            const result = await this.gameService.activateGame(id);
            const statusCode = result.success ? 200 : 404;
            this.sendResponse(res, result, statusCode);
        }
        catch (error) {
            this.handleError(error, req, res, next);
        }
    }
    /**
     * Deactivate game endpoint handler
     * PATCH /api/games/:id/deactivate
     */
    async deactivateGame(req, res, next) {
        try {
            const { id } = req.params;
            if (!id) {
                this.sendResponse(res, { success: false, error: 'Game ID is required' }, 400);
                return;
            }
            const result = await this.gameService.deactivateGame(id);
            const statusCode = result.success ? 200 : 404;
            this.sendResponse(res, result, statusCode);
        }
        catch (error) {
            this.handleError(error, req, res, next);
        }
    }
    /**
     * Refresh character count endpoint handler
     * PATCH /api/games/game-id/:gameId/refresh-character-count
     */
    async refreshCharacterCount(req, res, next) {
        try {
            const { gameId } = req.params;
            if (!gameId) {
                this.sendResponse(res, { success: false, error: 'Game ID is required' }, 400);
                return;
            }
            const result = await this.gameService.refreshCharacterCount(gameId);
            const statusCode = result.success ? 200 : 404;
            this.sendResponse(res, result, statusCode);
        }
        catch (error) {
            this.handleError(error, req, res, next);
        }
    }
}
exports.GameController = GameController;
//# sourceMappingURL=GameController.js.map