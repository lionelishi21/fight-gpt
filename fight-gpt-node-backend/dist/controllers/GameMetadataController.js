"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameMetadataController = void 0;
const BaseController_1 = require("./BaseController");
/**
 * Game Metadata controller implementation
 * Follows Single Responsibility Principle - handles HTTP requests/responses for game metadata
 * Follows Dependency Inversion Principle - depends on service interface
 */
class GameMetadataController extends BaseController_1.BaseController {
    gameMetadataService;
    auditLogRepository;
    constructor(gameMetadataService, auditLogRepository) {
        super();
        this.gameMetadataService = gameMetadataService;
        this.auditLogRepository = auditLogRepository;
    }
    /**
     * Create game metadata endpoint handler
     * POST /api/games/:gameId/metadata
     */
    async createGameMetadata(req, res, next) {
        const requestId = this.getRequestId(req);
        const startTime = Date.now();
        try {
            const { gameId } = req.params;
            const request = {
                ...req.body,
                game_id: gameId || req.body.game_id, // Use gameId from params if provided
            };
            const result = await this.gameMetadataService.createGameMetadata(request);
            const responseTime = Date.now() - startTime;
            await this.auditLogRepository.createAuditLog({
                request_id: requestId,
                endpoint: `/api/games/${gameId}/metadata`,
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
                endpoint: `/api/games/${req.params.gameId}/metadata`,
                method: 'POST',
                ip_address: req.ip,
                user_agent: req.headers['user-agent'],
                request_body: req.body,
                response_status: 500,
                response_time_ms: responseTime,
                error_message: error instanceof Error ? error.message : 'Unknown error',
            }).catch((err) => {
                console.error('[GameMetadataController] Failed to create audit log:', err);
            });
            this.handleError(error, req, res, next);
        }
    }
    /**
     * Get game metadata by MongoDB ID endpoint handler
     * GET /api/metadata/:id
     */
    async getGameMetadataById(req, res, next) {
        const requestId = this.getRequestId(req);
        const startTime = Date.now();
        try {
            const { id } = req.params;
            if (!id) {
                this.sendResponse(res, { success: false, error: 'Metadata ID is required' }, 400);
                return;
            }
            const result = await this.gameMetadataService.getGameMetadataById(id);
            const responseTime = Date.now() - startTime;
            await this.auditLogRepository.createAuditLog({
                request_id: requestId,
                endpoint: `/api/metadata/${id}`,
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
     * Get game metadata by game_id endpoint handler
     * GET /api/games/:gameId/metadata
     */
    async getGameMetadataByGameId(req, res, next) {
        const requestId = this.getRequestId(req);
        const startTime = Date.now();
        try {
            const { gameId } = req.params;
            if (!gameId) {
                this.sendResponse(res, { success: false, error: 'Game ID is required' }, 400);
                return;
            }
            const result = await this.gameMetadataService.getGameMetadataByGameId(gameId);
            const responseTime = Date.now() - startTime;
            await this.auditLogRepository.createAuditLog({
                request_id: requestId,
                endpoint: `/api/games/${gameId}/metadata`,
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
     * Get current game metadata by game_id endpoint handler (for AI service)
     * GET /api/games/:gameId/metadata/current
     */
    async getCurrentGameMetadata(req, res, next) {
        const requestId = this.getRequestId(req);
        const startTime = Date.now();
        try {
            const { gameId } = req.params;
            if (!gameId) {
                this.sendResponse(res, { success: false, error: 'Game ID is required' }, 400);
                return;
            }
            const result = await this.gameMetadataService.getCurrentGameMetadataByGameId(gameId);
            const responseTime = Date.now() - startTime;
            await this.auditLogRepository.createAuditLog({
                request_id: requestId,
                endpoint: `/api/games/${gameId}/metadata/current`,
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
     * Update game metadata by MongoDB ID endpoint handler
     * PUT /api/metadata/:id
     */
    async updateGameMetadata(req, res, next) {
        const requestId = this.getRequestId(req);
        const startTime = Date.now();
        try {
            const { id } = req.params;
            const request = req.body;
            if (!id) {
                this.sendResponse(res, { success: false, error: 'Metadata ID is required' }, 400);
                return;
            }
            const result = await this.gameMetadataService.updateGameMetadata(id, request);
            const responseTime = Date.now() - startTime;
            await this.auditLogRepository.createAuditLog({
                request_id: requestId,
                endpoint: `/api/metadata/${id}`,
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
     * Update game metadata by game_id endpoint handler
     * PUT /api/games/:gameId/metadata
     */
    async updateGameMetadataByGameId(req, res, next) {
        const requestId = this.getRequestId(req);
        const startTime = Date.now();
        try {
            const { gameId } = req.params;
            const request = req.body;
            if (!gameId) {
                this.sendResponse(res, { success: false, error: 'Game ID is required' }, 400);
                return;
            }
            const result = await this.gameMetadataService.updateGameMetadataByGameId(gameId, request);
            const responseTime = Date.now() - startTime;
            await this.auditLogRepository.createAuditLog({
                request_id: requestId,
                endpoint: `/api/games/${gameId}/metadata`,
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
     * Delete game metadata endpoint handler
     * DELETE /api/metadata/:id
     */
    async deleteGameMetadata(req, res, next) {
        const requestId = this.getRequestId(req);
        const startTime = Date.now();
        try {
            const { id } = req.params;
            if (!id) {
                this.sendResponse(res, { success: false, error: 'Metadata ID is required' }, 400);
                return;
            }
            const result = await this.gameMetadataService.deleteGameMetadata(id);
            const responseTime = Date.now() - startTime;
            await this.auditLogRepository.createAuditLog({
                request_id: requestId,
                endpoint: `/api/metadata/${id}`,
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
}
exports.GameMetadataController = GameMetadataController;
//# sourceMappingURL=GameMetadataController.js.map