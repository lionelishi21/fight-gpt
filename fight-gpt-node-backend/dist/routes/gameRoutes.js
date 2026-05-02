"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameRoutes = void 0;
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const validationMiddleware_1 = require("../middleware/validationMiddleware");
/**
 * Game routes
 * Follows Single Responsibility Principle - handles routing for game endpoints
 */
class GameRoutes {
    router;
    controller;
    constructor(controller) {
        this.router = (0, express_1.Router)();
        this.controller = controller;
        this.setupRoutes();
    }
    /**
     * Setup routes
     */
    setupRoutes() {
        // POST /api/games - Create game
        this.router.post('/', this.validateCreateGame(), validationMiddleware_1.validateRequest, (req, res, next) => this.controller.createGame(req, res, next));
        // GET /api/games/active - Get active games (for onboarding)
        this.router.get('/active', (req, res, next) => this.controller.getActiveGames(req, res, next));
        // GET /api/games/search - Search games
        this.router.get('/search', this.validateSearchGames(), validationMiddleware_1.validateRequest, (req, res, next) => this.controller.searchGames(req, res, next));
        // GET /api/games - Find games with filters
        this.router.get('/', this.validateFindGames(), validationMiddleware_1.validateRequest, (req, res, next) => this.controller.findGames(req, res, next));
        // GET /api/games/game-id/:gameId - Get game by game_id
        this.router.get('/game-id/:gameId', this.validateGameId(), validationMiddleware_1.validateRequest, (req, res, next) => this.controller.getGameByGameId(req, res, next));
        // PUT /api/games/game-id/:gameId - Update game by game_id
        this.router.put('/game-id/:gameId', this.validateGameId(), this.validateUpdateGame(), validationMiddleware_1.validateRequest, (req, res, next) => this.controller.updateGameByGameId(req, res, next));
        // PATCH /api/games/game-id/:gameId/refresh-character-count - Refresh character count
        this.router.patch('/game-id/:gameId/refresh-character-count', this.validateGameId(), validationMiddleware_1.validateRequest, (req, res, next) => this.controller.refreshCharacterCount(req, res, next));
        // GET /api/games/:id - Get game by MongoDB ID
        this.router.get('/:id', this.validateId(), validationMiddleware_1.validateRequest, (req, res, next) => this.controller.getGameById(req, res, next));
        // PUT /api/games/:id - Update game by MongoDB ID
        this.router.put('/:id', this.validateId(), this.validateUpdateGame(), validationMiddleware_1.validateRequest, (req, res, next) => this.controller.updateGame(req, res, next));
        // PATCH /api/games/:id/activate - Activate game
        this.router.patch('/:id/activate', this.validateId(), validationMiddleware_1.validateRequest, (req, res, next) => this.controller.activateGame(req, res, next));
        // PATCH /api/games/:id/deactivate - Deactivate game
        this.router.patch('/:id/deactivate', this.validateId(), validationMiddleware_1.validateRequest, (req, res, next) => this.controller.deactivateGame(req, res, next));
        // DELETE /api/games/:id - Delete game
        this.router.delete('/:id', this.validateId(), validationMiddleware_1.validateRequest, (req, res, next) => this.controller.deleteGame(req, res, next));
    }
    /**
     * Get router instance
     */
    getRouter() {
        return this.router;
    }
    /**
     * Validation rules for create game
     */
    validateCreateGame() {
        return [
            (0, express_validator_1.body)('game_id')
                .notEmpty()
                .withMessage('game_id is required')
                .isString()
                .matches(/^[a-z0-9_]+$/)
                .withMessage('game_id must contain only lowercase letters, numbers, and underscores'),
            (0, express_validator_1.body)('name').notEmpty().withMessage('name is required').isString(),
            (0, express_validator_1.body)('full_name').optional().isString(),
            (0, express_validator_1.body)('publisher').optional().isString(),
            (0, express_validator_1.body)('developer').optional().isString(),
            (0, express_validator_1.body)('release_date').optional().isISO8601().withMessage('release_date must be a valid date'),
            (0, express_validator_1.body)('genre').optional().isString(),
            (0, express_validator_1.body)('platform').optional().isArray().withMessage('platform must be an array'),
            (0, express_validator_1.body)('platform.*').optional().isString(),
            (0, express_validator_1.body)('icon_url').optional().isURL().withMessage('icon_url must be a valid URL'),
            (0, express_validator_1.body)('banner_url').optional().isURL().withMessage('banner_url must be a valid URL'),
            (0, express_validator_1.body)('description').optional().isString(),
            (0, express_validator_1.body)('is_active').optional().isBoolean().withMessage('is_active must be a boolean'),
            (0, express_validator_1.body)('latest_version').optional().isString(),
        ];
    }
    /**
     * Validation rules for update game
     */
    validateUpdateGame() {
        return [
            (0, express_validator_1.body)('game_id')
                .optional()
                .isString()
                .matches(/^[a-z0-9_]+$/)
                .withMessage('game_id must contain only lowercase letters, numbers, and underscores'),
            (0, express_validator_1.body)('name').optional().isString(),
            (0, express_validator_1.body)('full_name').optional().isString(),
            (0, express_validator_1.body)('publisher').optional().isString(),
            (0, express_validator_1.body)('developer').optional().isString(),
            (0, express_validator_1.body)('release_date').optional().isISO8601().withMessage('release_date must be a valid date'),
            (0, express_validator_1.body)('genre').optional().isString(),
            (0, express_validator_1.body)('platform').optional().isArray().withMessage('platform must be an array'),
            (0, express_validator_1.body)('platform.*').optional().isString(),
            (0, express_validator_1.body)('icon_url').optional().isURL().withMessage('icon_url must be a valid URL'),
            (0, express_validator_1.body)('banner_url').optional().isURL().withMessage('banner_url must be a valid URL'),
            (0, express_validator_1.body)('description').optional().isString(),
            (0, express_validator_1.body)('is_active').optional().isBoolean().withMessage('is_active must be a boolean'),
            (0, express_validator_1.body)('supported_characters_count')
                .optional()
                .isInt({ min: 0 })
                .withMessage('supported_characters_count must be a non-negative integer'),
            (0, express_validator_1.body)('latest_version').optional().isString(),
        ];
    }
    /**
     * Validation rules for ID parameter
     */
    validateId() {
        return [
            (0, express_validator_1.param)('id')
                .notEmpty()
                .withMessage('Game ID is required')
                .matches(/^[0-9a-fA-F]{24}$/)
                .withMessage('Invalid game ID format'),
        ];
    }
    /**
     * Validation rules for gameId parameter
     */
    validateGameId() {
        return [
            (0, express_validator_1.param)('gameId')
                .notEmpty()
                .withMessage('Game ID is required')
                .isString()
                .matches(/^[a-z0-9_]+$/)
                .withMessage('gameId must contain only lowercase letters, numbers, and underscores'),
        ];
    }
    /**
     * Validation rules for find games query
     */
    validateFindGames() {
        return [
            (0, express_validator_1.query)('gameId').optional().isString(),
            (0, express_validator_1.query)('name').optional().isString(),
            (0, express_validator_1.query)('publisher').optional().isString(),
            (0, express_validator_1.query)('developer').optional().isString(),
            (0, express_validator_1.query)('genre').optional().isString(),
            (0, express_validator_1.query)('platform').optional().isString(),
            (0, express_validator_1.query)('isActive')
                .optional()
                .isBoolean()
                .withMessage('isActive must be a boolean')
                .toBoolean(),
            (0, express_validator_1.query)('limit')
                .optional()
                .isInt({ min: 1, max: 1000 })
                .withMessage('limit must be between 1 and 1000'),
        ];
    }
    /**
     * Validation rules for search games query
     */
    validateSearchGames() {
        return [
            (0, express_validator_1.query)('q')
                .notEmpty()
                .withMessage('Search query (q) is required')
                .isString()
                .isLength({ min: 1 })
                .withMessage('Search query must not be empty'),
        ];
    }
}
exports.GameRoutes = GameRoutes;
//# sourceMappingURL=gameRoutes.js.map