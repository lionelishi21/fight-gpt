"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CharacterEncyclopediaController = void 0;
const BaseController_1 = require("./BaseController");
/**
 * Character Encyclopedia controller implementation
 * Follows Single Responsibility Principle - handles HTTP requests/responses for character encyclopedia
 * Follows Dependency Inversion Principle - depends on service interface
 */
class CharacterEncyclopediaController extends BaseController_1.BaseController {
    characterEncyclopediaService;
    auditLogRepository;
    constructor(characterEncyclopediaService, auditLogRepository) {
        super();
        this.characterEncyclopediaService = characterEncyclopediaService;
        this.auditLogRepository = auditLogRepository;
    }
    /**
     * Create character encyclopedia endpoint handler
     * POST /api/characters/:characterId/encyclopedia
     */
    async createEncyclopedia(req, res, next) {
        const requestId = this.getRequestId(req);
        const startTime = Date.now();
        try {
            const { gameId, characterId } = req.params;
            const request = {
                ...req.body,
                game_id: gameId || req.body.game_id,
                character_id: characterId || req.body.character_id,
            };
            const result = await this.characterEncyclopediaService.createEncyclopedia(request);
            const responseTime = Date.now() - startTime;
            await this.auditLogRepository.createAuditLog({
                request_id: requestId,
                endpoint: `/api/games/${gameId}/characters/${characterId}/encyclopedia`,
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
                endpoint: `/api/games/${req.params.gameId}/characters/${req.params.characterId}/encyclopedia`,
                method: 'POST',
                ip_address: req.ip,
                user_agent: req.headers['user-agent'],
                request_body: req.body,
                response_status: 500,
                response_time_ms: responseTime,
                error_message: error instanceof Error ? error.message : 'Unknown error',
            }).catch((err) => {
                console.error('[CharacterEncyclopediaController] Failed to create audit log:', err);
            });
            this.handleError(error, req, res, next);
        }
    }
    /**
     * Get character encyclopedia by MongoDB ID endpoint handler
     * GET /api/encyclopedia/:id
     */
    async getEncyclopediaById(req, res, next) {
        const requestId = this.getRequestId(req);
        const startTime = Date.now();
        try {
            const { id } = req.params;
            if (!id) {
                this.sendResponse(res, { success: false, error: 'Encyclopedia ID is required' }, 400);
                return;
            }
            const result = await this.characterEncyclopediaService.getEncyclopediaById(id);
            const responseTime = Date.now() - startTime;
            await this.auditLogRepository.createAuditLog({
                request_id: requestId,
                endpoint: `/api/encyclopedia/${id}`,
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
     * Get character encyclopedia by game_id and character_id endpoint handler
     * GET /api/games/:gameId/characters/:characterId/encyclopedia
     */
    async getEncyclopediaByGameAndCharacter(req, res, next) {
        const requestId = this.getRequestId(req);
        const startTime = Date.now();
        try {
            const { gameId, characterId } = req.params;
            if (!gameId) {
                this.sendResponse(res, { success: false, error: 'Game ID is required' }, 400);
                return;
            }
            if (!characterId) {
                this.sendResponse(res, { success: false, error: 'Character ID is required' }, 400);
                return;
            }
            const result = await this.characterEncyclopediaService.getEncyclopediaByGameAndCharacter(gameId, characterId);
            const responseTime = Date.now() - startTime;
            await this.auditLogRepository.createAuditLog({
                request_id: requestId,
                endpoint: `/api/games/${gameId}/characters/${characterId}/encyclopedia`,
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
     * Get current character encyclopedia by game_id and character_id endpoint handler (for AI service)
     * GET /api/games/:gameId/characters/:characterId/encyclopedia/current
     */
    async getCurrentEncyclopedia(req, res, next) {
        const requestId = this.getRequestId(req);
        const startTime = Date.now();
        try {
            const { gameId, characterId } = req.params;
            if (!gameId) {
                this.sendResponse(res, { success: false, error: 'Game ID is required' }, 400);
                return;
            }
            if (!characterId) {
                this.sendResponse(res, { success: false, error: 'Character ID is required' }, 400);
                return;
            }
            const result = await this.characterEncyclopediaService.getCurrentEncyclopediaByGameAndCharacter(gameId, characterId);
            const responseTime = Date.now() - startTime;
            await this.auditLogRepository.createAuditLog({
                request_id: requestId,
                endpoint: `/api/games/${gameId}/characters/${characterId}/encyclopedia/current`,
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
     * Get all character encyclopedias by game_id endpoint handler
     * GET /api/games/:gameId/encyclopedia
     */
    async getEncyclopediasByGame(req, res, next) {
        const requestId = this.getRequestId(req);
        const startTime = Date.now();
        try {
            const { gameId } = req.params;
            if (!gameId) {
                this.sendResponse(res, { success: false, error: 'Game ID is required' }, 400);
                return;
            }
            const result = await this.characterEncyclopediaService.getEncyclopediasByGame(gameId);
            const responseTime = Date.now() - startTime;
            await this.auditLogRepository.createAuditLog({
                request_id: requestId,
                endpoint: `/api/games/${gameId}/encyclopedia`,
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
     * Get game rules for a character endpoint handler (for AI service)
     * GET /api/games/:gameId/characters/:characterId/encyclopedia/rules
     */
    async getGameRules(req, res, next) {
        const requestId = this.getRequestId(req);
        const startTime = Date.now();
        try {
            const { gameId, characterId } = req.params;
            if (!gameId) {
                this.sendResponse(res, { success: false, error: 'Game ID is required' }, 400);
                return;
            }
            if (!characterId) {
                this.sendResponse(res, { success: false, error: 'Character ID is required' }, 400);
                return;
            }
            const result = await this.characterEncyclopediaService.getGameRules(gameId, characterId);
            const responseTime = Date.now() - startTime;
            await this.auditLogRepository.createAuditLog({
                request_id: requestId,
                endpoint: `/api/games/${gameId}/characters/${characterId}/encyclopedia/rules`,
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
     * Update character encyclopedia by MongoDB ID endpoint handler
     * PUT /api/encyclopedia/:id
     */
    async updateEncyclopedia(req, res, next) {
        const requestId = this.getRequestId(req);
        const startTime = Date.now();
        try {
            const { id } = req.params;
            const request = req.body;
            if (!id) {
                this.sendResponse(res, { success: false, error: 'Encyclopedia ID is required' }, 400);
                return;
            }
            const result = await this.characterEncyclopediaService.updateEncyclopedia(id, request);
            const responseTime = Date.now() - startTime;
            await this.auditLogRepository.createAuditLog({
                request_id: requestId,
                endpoint: `/api/encyclopedia/${id}`,
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
     * Update character encyclopedia by game_id and character_id endpoint handler
     * PUT /api/games/:gameId/characters/:characterId/encyclopedia
     */
    async updateEncyclopediaByGameAndCharacter(req, res, next) {
        const requestId = this.getRequestId(req);
        const startTime = Date.now();
        try {
            const { gameId, characterId } = req.params;
            const request = req.body;
            if (!gameId) {
                this.sendResponse(res, { success: false, error: 'Game ID is required' }, 400);
                return;
            }
            if (!characterId) {
                this.sendResponse(res, { success: false, error: 'Character ID is required' }, 400);
                return;
            }
            const result = await this.characterEncyclopediaService.updateEncyclopediaByGameAndCharacter(gameId, characterId, request);
            const responseTime = Date.now() - startTime;
            await this.auditLogRepository.createAuditLog({
                request_id: requestId,
                endpoint: `/api/games/${gameId}/characters/${characterId}/encyclopedia`,
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
     * Delete character encyclopedia endpoint handler
     * DELETE /api/encyclopedia/:id
     */
    async deleteEncyclopedia(req, res, next) {
        const requestId = this.getRequestId(req);
        const startTime = Date.now();
        try {
            const { id } = req.params;
            if (!id) {
                this.sendResponse(res, { success: false, error: 'Encyclopedia ID is required' }, 400);
                return;
            }
            const result = await this.characterEncyclopediaService.deleteEncyclopedia(id);
            const responseTime = Date.now() - startTime;
            await this.auditLogRepository.createAuditLog({
                request_id: requestId,
                endpoint: `/api/encyclopedia/${id}`,
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
exports.CharacterEncyclopediaController = CharacterEncyclopediaController;
//# sourceMappingURL=CharacterEncyclopediaController.js.map