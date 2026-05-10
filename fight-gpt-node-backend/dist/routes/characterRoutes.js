"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CharacterRoutes = void 0;
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const validationMiddleware_1 = require("../middleware/validationMiddleware");
/**
 * Character routes
 * Follows Single Responsibility Principle - handles routing for character endpoints
 */
class CharacterRoutes {
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
        // POST /api/characters - Create character
        this.router.post('/', this.validateCreateCharacter(), validationMiddleware_1.validateRequest, (req, res, next) => this.controller.createCharacter(req, res, next));
        // GET /api/characters - Find characters with filters
        this.router.get('/', this.validateFindCharacters(), validationMiddleware_1.validateRequest, (req, res, next) => this.controller.findCharacters(req, res, next));
        // GET /api/characters/search - Search characters
        this.router.get('/search', this.validateSearchCharacters(), validationMiddleware_1.validateRequest, (req, res, next) => this.controller.searchCharacters(req, res, next));
        // GET /api/characters/game/:gameId - Get all characters by game
        this.router.get('/game/:gameId', this.validateGameId(), validationMiddleware_1.validateRequest, (req, res, next) => this.controller.getCharactersByGame(req, res, next));
        // GET /api/characters/game/:gameId/current - Get current characters by game
        this.router.get('/game/:gameId/current', this.validateGameId(), validationMiddleware_1.validateRequest, (req, res, next) => this.controller.getCurrentCharactersByGame(req, res, next));
        // GET /api/characters/game/:gameId/name/:name - Get characters by game and name
        this.router.get('/game/:gameId/name/:name', this.validateGameIdAndName(), validationMiddleware_1.validateRequest, (req, res, next) => this.controller.getCharactersByGameAndName(req, res, next));
        // GET /api/characters/game/:gameId/name/:name/current - Get current character by game and name
        this.router.get('/game/:gameId/name/:name/current', this.validateGameIdAndName(), validationMiddleware_1.validateRequest, (req, res, next) => this.controller.getCurrentCharacterByGameAndName(req, res, next));
        // GET /api/characters/game/:gameId/version/:version - Get characters by game and version
        this.router.get('/game/:gameId/version/:version', this.validateGameIdAndVersion(), validationMiddleware_1.validateRequest, (req, res, next) => this.controller.getCharactersByGameAndVersion(req, res, next));
        // GET /api/characters/:id - Get character by ID
        this.router.get('/:id', this.validateId(), validationMiddleware_1.validateRequest, (req, res, next) => this.controller.getCharacterById(req, res, next));
        // PUT /api/characters/:id - Update character
        this.router.put('/:id', this.validateId(), this.validateUpdateCharacter(), validationMiddleware_1.validateRequest, (req, res, next) => this.controller.updateCharacter(req, res, next));
        // PATCH /api/characters/:id/current - Set character as current
        this.router.patch('/:id/current', this.validateId(), this.validateSetCurrent(), validationMiddleware_1.validateRequest, (req, res, next) => this.controller.setCharacterAsCurrent(req, res, next));
        // DELETE /api/characters/:id - Delete character
        this.router.delete('/:id', this.validateId(), validationMiddleware_1.validateRequest, (req, res, next) => this.controller.deleteCharacter(req, res, next));
        // GET /api/characters/game/:gameId/pros - Get verified pro players by game
        this.router.get('/game/:gameId/pros', this.validateGameId(), validationMiddleware_1.validateRequest, (req, res, next) => this.controller.getProsByGame(req, res, next));
    }
    /**
     * Get router instance
     */
    getRouter() {
        return this.router;
    }
    /**
     * Validation rules for create character
     */
    validateCreateCharacter() {
        return [
            (0, express_validator_1.body)('game_id').notEmpty().withMessage('game_id is required').isString(),
            (0, express_validator_1.body)('name').notEmpty().withMessage('name is required').isString(),
            (0, express_validator_1.body)('version').notEmpty().withMessage('version is required').isString(),
            (0, express_validator_1.body)('is_current').isBoolean().withMessage('is_current must be a boolean'),
            (0, express_validator_1.body)('stats').isObject().withMessage('stats must be an object'),
            (0, express_validator_1.body)('moves')
                .isArray()
                .withMessage('moves must be an array')
                .custom((moves) => {
                if (!Array.isArray(moves))
                    return false;
                for (const move of moves) {
                    if (!move.id || !move.name || move.startup === undefined || move.active === undefined || move.recovery === undefined || move.on_block === undefined) {
                        return false;
                    }
                }
                return true;
            })
                .withMessage('Each move must have id, name, startup, active, recovery, and on_block'),
            (0, express_validator_1.body)('patch_notes_summary').optional().isString(),
        ];
    }
    /**
     * Validation rules for update character
     */
    validateUpdateCharacter() {
        return [
            (0, express_validator_1.body)('game_id').optional().isString(),
            (0, express_validator_1.body)('name').optional().isString(),
            (0, express_validator_1.body)('version').optional().isString(),
            (0, express_validator_1.body)('is_current').optional().isBoolean(),
            (0, express_validator_1.body)('stats').optional().isObject(),
            (0, express_validator_1.body)('moves')
                .optional()
                .isArray()
                .custom((moves) => {
                if (!Array.isArray(moves))
                    return false;
                for (const move of moves) {
                    if (!move.id || !move.name || move.startup === undefined || move.active === undefined || move.recovery === undefined || move.on_block === undefined) {
                        return false;
                    }
                }
                return true;
            })
                .withMessage('Each move must have id, name, startup, active, recovery, and on_block'),
            (0, express_validator_1.body)('patch_notes_summary').optional().isString(),
        ];
    }
    /**
     * Validation rules for ID parameter
     */
    validateId() {
        return [
            (0, express_validator_1.param)('id')
                .notEmpty()
                .withMessage('Character ID is required')
                .matches(/^[0-9a-fA-F]{24}$/)
                .withMessage('Invalid character ID format'),
        ];
    }
    /**
     * Validation rules for gameId parameter
     */
    validateGameId() {
        return [(0, express_validator_1.param)('gameId').notEmpty().withMessage('Game ID is required').isString()];
    }
    /**
     * Validation rules for gameId and name parameters
     */
    validateGameIdAndName() {
        return [
            (0, express_validator_1.param)('gameId').notEmpty().withMessage('Game ID is required').isString(),
            (0, express_validator_1.param)('name').notEmpty().withMessage('Character name is required').isString(),
        ];
    }
    /**
     * Validation rules for gameId and version parameters
     */
    validateGameIdAndVersion() {
        return [
            (0, express_validator_1.param)('gameId').notEmpty().withMessage('Game ID is required').isString(),
            (0, express_validator_1.param)('version').notEmpty().withMessage('Version is required').isString(),
        ];
    }
    /**
     * Validation rules for find characters query
     */
    validateFindCharacters() {
        return [
            (0, express_validator_1.query)('gameId').optional().isString(),
            (0, express_validator_1.query)('name').optional().isString(),
            (0, express_validator_1.query)('version').optional().isString(),
            (0, express_validator_1.query)('isCurrent').optional().isBoolean().withMessage('isCurrent must be a boolean'),
            (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('limit must be between 1 and 1000'),
        ];
    }
    /**
     * Validation rules for search characters query
     */
    validateSearchCharacters() {
        return [
            (0, express_validator_1.query)('q').notEmpty().withMessage('Search query (q) is required').isString(),
            (0, express_validator_1.query)('gameId').optional().isString(),
        ];
    }
    /**
     * Validation rules for set current
     */
    validateSetCurrent() {
        return [
            (0, express_validator_1.body)('isCurrent').notEmpty().withMessage('isCurrent is required').isBoolean().withMessage('isCurrent must be a boolean'),
        ];
    }
}
exports.CharacterRoutes = CharacterRoutes;
//# sourceMappingURL=characterRoutes.js.map