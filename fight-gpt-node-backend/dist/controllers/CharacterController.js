"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CharacterController = void 0;
const BaseController_1 = require("./BaseController");
/**
 * Character controller implementation
 * Follows Single Responsibility Principle - handles HTTP requests/responses for characters
 * Follows Dependency Inversion Principle - depends on service interface
 */
class CharacterController extends BaseController_1.BaseController {
    characterService;
    auditLogRepository;
    constructor(characterService, auditLogRepository) {
        super();
        this.characterService = characterService;
        this.auditLogRepository = auditLogRepository;
    }
    /**
     * Create character endpoint handler
     * POST /api/characters
     */
    async createCharacter(req, res, next) {
        const requestId = this.getRequestId(req);
        const startTime = Date.now();
        try {
            const request = req.body;
            const result = await this.characterService.createCharacter(request);
            const responseTime = Date.now() - startTime;
            await this.auditLogRepository.createAuditLog({
                request_id: requestId,
                endpoint: '/api/characters',
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
                endpoint: '/api/characters',
                method: 'POST',
                ip_address: req.ip,
                user_agent: req.headers['user-agent'],
                request_body: req.body,
                response_status: 500,
                response_time_ms: responseTime,
                error_message: error instanceof Error ? error.message : 'Unknown error',
            }).catch((err) => {
                console.error('[CharacterController] Failed to create audit log:', err);
            });
            this.handleError(error, req, res, next);
        }
    }
    /**
     * Get character by ID endpoint handler
     * GET /api/characters/:id
     */
    async getCharacterById(req, res, next) {
        const requestId = this.getRequestId(req);
        const startTime = Date.now();
        try {
            const { id } = req.params;
            if (!id) {
                this.sendResponse(res, { success: false, error: 'Character ID is required' }, 400);
                return;
            }
            const result = await this.characterService.getCharacterById(id);
            const responseTime = Date.now() - startTime;
            await this.auditLogRepository.createAuditLog({
                request_id: requestId,
                endpoint: `/api/characters/${id}`,
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
     * Update character endpoint handler
     * PUT /api/characters/:id
     */
    async updateCharacter(req, res, next) {
        const requestId = this.getRequestId(req);
        const startTime = Date.now();
        try {
            const { id } = req.params;
            const request = req.body;
            if (!id) {
                this.sendResponse(res, { success: false, error: 'Character ID is required' }, 400);
                return;
            }
            const result = await this.characterService.updateCharacter(id, request);
            const responseTime = Date.now() - startTime;
            await this.auditLogRepository.createAuditLog({
                request_id: requestId,
                endpoint: `/api/characters/${id}`,
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
     * Delete character endpoint handler
     * DELETE /api/characters/:id
     */
    async deleteCharacter(req, res, next) {
        const requestId = this.getRequestId(req);
        const startTime = Date.now();
        try {
            const { id } = req.params;
            if (!id) {
                this.sendResponse(res, { success: false, error: 'Character ID is required' }, 400);
                return;
            }
            const result = await this.characterService.deleteCharacter(id);
            const responseTime = Date.now() - startTime;
            await this.auditLogRepository.createAuditLog({
                request_id: requestId,
                endpoint: `/api/characters/${id}`,
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
     * Get characters by game endpoint handler
     * GET /api/characters/game/:gameId
     */
    async getCharactersByGame(req, res, next) {
        try {
            const { gameId } = req.params;
            if (!gameId) {
                this.sendResponse(res, { success: false, error: 'Game ID is required' }, 400);
                return;
            }
            const result = await this.characterService.getCharactersByGame(gameId);
            this.sendResponse(res, result, result.success ? 200 : 400);
        }
        catch (error) {
            this.handleError(error, req, res, next);
        }
    }
    /**
     * Get current characters by game endpoint handler
     * GET /api/characters/game/:gameId/current
     */
    async getCurrentCharactersByGame(req, res, next) {
        try {
            const { gameId } = req.params;
            if (!gameId) {
                this.sendResponse(res, { success: false, error: 'Game ID is required' }, 400);
                return;
            }
            const result = await this.characterService.getCurrentCharactersByGame(gameId);
            this.sendResponse(res, result, result.success ? 200 : 400);
        }
        catch (error) {
            this.handleError(error, req, res, next);
        }
    }
    /**
     * Get characters by game and name endpoint handler
     * GET /api/characters/game/:gameId/name/:name
     */
    async getCharactersByGameAndName(req, res, next) {
        try {
            const { gameId, name } = req.params;
            if (!gameId || !name) {
                this.sendResponse(res, { success: false, error: 'Game ID and name are required' }, 400);
                return;
            }
            const result = await this.characterService.getCharactersByGameAndName(gameId, name);
            this.sendResponse(res, result, result.success ? 200 : 400);
        }
        catch (error) {
            this.handleError(error, req, res, next);
        }
    }
    /**
     * Get characters by game and version endpoint handler
     * GET /api/characters/game/:gameId/version/:version
     */
    async getCharactersByGameAndVersion(req, res, next) {
        try {
            const { gameId, version } = req.params;
            if (!gameId || !version) {
                this.sendResponse(res, { success: false, error: 'Game ID and version are required' }, 400);
                return;
            }
            const result = await this.characterService.getCharactersByGameAndVersion(gameId, version);
            this.sendResponse(res, result, result.success ? 200 : 400);
        }
        catch (error) {
            this.handleError(error, req, res, next);
        }
    }
    /**
     * Get current character by game and name endpoint handler
     * GET /api/characters/game/:gameId/name/:name/current
     */
    async getCurrentCharacterByGameAndName(req, res, next) {
        try {
            const { gameId, name } = req.params;
            if (!gameId || !name) {
                this.sendResponse(res, { success: false, error: 'Game ID and name are required' }, 400);
                return;
            }
            const result = await this.characterService.getCurrentCharacterByGameAndName(gameId, name);
            const statusCode = result.success ? 200 : 404;
            this.sendResponse(res, result, statusCode);
        }
        catch (error) {
            this.handleError(error, req, res, next);
        }
    }
    /**
     * Search characters endpoint handler
     * GET /api/characters/search?q=query&gameId=gameId
     */
    async searchCharacters(req, res, next) {
        try {
            const { q, gameId } = req.query;
            if (!q || typeof q !== 'string') {
                this.sendResponse(res, { success: false, error: 'Search query (q) is required' }, 400);
                return;
            }
            const result = await this.characterService.searchCharacters(q, gameId ? gameId : undefined);
            this.sendResponse(res, result, result.success ? 200 : 400);
        }
        catch (error) {
            this.handleError(error, req, res, next);
        }
    }
    /**
     * Find characters with filters endpoint handler
     * GET /api/characters?gameId=...&name=...&version=...&isCurrent=...
     */
    async findCharacters(req, res, next) {
        try {
            const filters = {
                game_id: req.query.gameId,
                name: req.query.name,
                version: req.query.version,
                is_current: req.query.isCurrent !== undefined ? req.query.isCurrent === 'true' : undefined,
            };
            const limit = req.query.limit ? parseInt(req.query.limit, 10) : undefined;
            const result = await this.characterService.findCharacters(filters, limit);
            this.sendResponse(res, result, result.success ? 200 : 400);
        }
        catch (error) {
            this.handleError(error, req, res, next);
        }
    }
    /**
     * Set character as current endpoint handler
     * PATCH /api/characters/:id/current
     */
    async setCharacterAsCurrent(req, res, next) {
        try {
            const { id } = req.params;
            const { isCurrent } = req.body;
            if (!id) {
                this.sendResponse(res, { success: false, error: 'Character ID is required' }, 400);
                return;
            }
            if (typeof isCurrent !== 'boolean') {
                this.sendResponse(res, { success: false, error: 'isCurrent must be a boolean' }, 400);
                return;
            }
            const result = await this.characterService.setCharacterAsCurrent(id, isCurrent);
            const statusCode = result.success ? 200 : 404;
            this.sendResponse(res, result, statusCode);
        }
        catch (error) {
            this.handleError(error, req, res, next);
        }
    }
    /**
     * Get verified pros by game
     * GET /api/characters/game/:gameId/pros
     */
    async getProsByGame(req, res, next) {
        try {
            const { gameId } = req.params;
            if (!gameId) {
                this.sendResponse(res, { success: false, error: 'Game ID is required' }, 400);
                return;
            }
            const result = await this.characterService.getProsByGame(gameId);
            this.sendResponse(res, result, result.success ? 200 : 400);
        }
        catch (error) {
            this.handleError(error, req, res, next);
        }
    }
}
exports.CharacterController = CharacterController;
//# sourceMappingURL=CharacterController.js.map