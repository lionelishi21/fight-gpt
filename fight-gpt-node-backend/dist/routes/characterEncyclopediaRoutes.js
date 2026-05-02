"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CharacterEncyclopediaRoutes = void 0;
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const validationMiddleware_1 = require("../middleware/validationMiddleware");
/**
 * Character Encyclopedia routes
 * Follows Single Responsibility Principle - handles routing for character encyclopedia endpoints
 */
class CharacterEncyclopediaRoutes {
    router;
    controller;
    constructor(controller) {
        this.router = (0, express_1.Router)();
        this.controller = controller;
        this.setupRoutes();
    }
    /**
     * Setup routes
     * Note: Order matters - more specific routes must come before less specific ones
     */
    setupRoutes() {
        // POST /api/games/:gameId/characters/:characterId/encyclopedia - Create encyclopedia
        this.router.post('/games/:gameId/characters/:characterId/encyclopedia', this.validateGameId(), this.validateCharacterId(), this.validateCreateEncyclopedia(), validationMiddleware_1.validateRequest, (req, res, next) => this.controller.createEncyclopedia(req, res, next));
        // GET /api/games/:gameId/characters/:characterId/encyclopedia/rules - Get game_rules (for AI)
        // Must come before /current route to avoid route conflicts
        this.router.get('/games/:gameId/characters/:characterId/encyclopedia/rules', this.validateGameId(), this.validateCharacterId(), validationMiddleware_1.validateRequest, (req, res, next) => this.controller.getGameRules(req, res, next));
        // GET /api/games/:gameId/characters/:characterId/encyclopedia/current - Get current (for AI)
        // Must come before generic encyclopedia route
        this.router.get('/games/:gameId/characters/:characterId/encyclopedia/current', this.validateGameId(), this.validateCharacterId(), validationMiddleware_1.validateRequest, (req, res, next) => this.controller.getCurrentEncyclopedia(req, res, next));
        // GET /api/games/:gameId/characters/:characterId/encyclopedia - Get encyclopedia by game and character
        this.router.get('/games/:gameId/characters/:characterId/encyclopedia', this.validateGameId(), this.validateCharacterId(), validationMiddleware_1.validateRequest, (req, res, next) => this.controller.getEncyclopediaByGameAndCharacter(req, res, next));
        // PUT /api/games/:gameId/characters/:characterId/encyclopedia - Update by game and character
        this.router.put('/games/:gameId/characters/:characterId/encyclopedia', this.validateGameId(), this.validateCharacterId(), this.validateUpdateEncyclopedia(), validationMiddleware_1.validateRequest, (req, res, next) => this.controller.updateEncyclopediaByGameAndCharacter(req, res, next));
        // GET /api/games/:gameId/encyclopedia - Get all encyclopedias for game
        this.router.get('/games/:gameId/encyclopedia', this.validateGameId(), validationMiddleware_1.validateRequest, (req, res, next) => this.controller.getEncyclopediasByGame(req, res, next));
        // GET /api/encyclopedia/:id - Get by MongoDB ID
        this.router.get('/encyclopedia/:id', this.validateId(), validationMiddleware_1.validateRequest, (req, res, next) => this.controller.getEncyclopediaById(req, res, next));
        // PUT /api/encyclopedia/:id - Update by ID
        this.router.put('/encyclopedia/:id', this.validateId(), this.validateUpdateEncyclopedia(), validationMiddleware_1.validateRequest, (req, res, next) => this.controller.updateEncyclopedia(req, res, next));
        // DELETE /api/encyclopedia/:id - Delete
        this.router.delete('/encyclopedia/:id', this.validateId(), validationMiddleware_1.validateRequest, (req, res, next) => this.controller.deleteEncyclopedia(req, res, next));
    }
    /**
     * Get router instance
     */
    getRouter() {
        return this.router;
    }
    /**
     * Validation rules for create character encyclopedia
     */
    validateCreateEncyclopedia() {
        return [
            (0, express_validator_1.body)('patch_version')
                .notEmpty()
                .withMessage('patch_version is required')
                .isString()
                .withMessage('patch_version must be a string'),
            (0, express_validator_1.body)('is_current_patch').optional().isBoolean().withMessage('is_current_patch must be a boolean'),
            (0, express_validator_1.body)('moveset')
                .notEmpty()
                .withMessage('moveset is required')
                .isObject()
                .withMessage('moveset must be an object'),
            (0, express_validator_1.body)('moveset.normals')
                .notEmpty()
                .withMessage('moveset.normals is required')
                .isArray()
                .withMessage('moveset.normals must be an array'),
            (0, express_validator_1.body)('moveset.specials')
                .notEmpty()
                .withMessage('moveset.specials is required')
                .isArray()
                .withMessage('moveset.specials must be an array'),
            (0, express_validator_1.body)('moveset.ex_moves')
                .notEmpty()
                .withMessage('moveset.ex_moves is required')
                .isArray()
                .withMessage('moveset.ex_moves must be an array'),
            (0, express_validator_1.body)('moveset.supers')
                .notEmpty()
                .withMessage('moveset.supers is required')
                .isArray()
                .withMessage('moveset.supers must be an array'),
            (0, express_validator_1.body)('moveset.assists').optional().isArray().withMessage('moveset.assists must be an array'),
            (0, express_validator_1.body)('moveset.dhc').optional().isArray().withMessage('moveset.dhc must be an array'),
            (0, express_validator_1.body)('moveset.team_supers').optional().isArray().withMessage('moveset.team_supers must be an array'),
            (0, express_validator_1.body)('game_rules')
                .notEmpty()
                .withMessage('game_rules is required')
                .isArray()
                .withMessage('game_rules must be an array'),
            (0, express_validator_1.body)('game_rules.*.key')
                .notEmpty()
                .withMessage('game_rules[].key is required')
                .isString()
                .withMessage('game_rules[].key must be a string'),
            (0, express_validator_1.body)('game_rules.*.value')
                .notEmpty()
                .withMessage('game_rules[].value is required'),
            (0, express_validator_1.body)('game_rules.*.ui_type')
                .notEmpty()
                .withMessage('game_rules[].ui_type is required')
                .isString()
                .withMessage('game_rules[].ui_type must be a string'),
            (0, express_validator_1.body)('game_rules.*.description').optional().isString(),
            (0, express_validator_1.body)('game_rules.*.metadata').optional().isObject(),
            (0, express_validator_1.body)('legacy_movesets').optional().isArray().withMessage('legacy_movesets must be an array'),
        ];
    }
    /**
     * Validation rules for update character encyclopedia
     */
    validateUpdateEncyclopedia() {
        return [
            (0, express_validator_1.body)('patch_version').optional().isString().withMessage('patch_version must be a string'),
            (0, express_validator_1.body)('is_current_patch').optional().isBoolean().withMessage('is_current_patch must be a boolean'),
            (0, express_validator_1.body)('moveset').optional().isObject().withMessage('moveset must be an object'),
            (0, express_validator_1.body)('moveset.normals').optional().isArray().withMessage('moveset.normals must be an array'),
            (0, express_validator_1.body)('moveset.specials').optional().isArray().withMessage('moveset.specials must be an array'),
            (0, express_validator_1.body)('moveset.ex_moves').optional().isArray().withMessage('moveset.ex_moves must be an array'),
            (0, express_validator_1.body)('moveset.supers').optional().isArray().withMessage('moveset.supers must be an array'),
            (0, express_validator_1.body)('moveset.assists').optional().isArray().withMessage('moveset.assists must be an array'),
            (0, express_validator_1.body)('moveset.dhc').optional().isArray().withMessage('moveset.dhc must be an array'),
            (0, express_validator_1.body)('moveset.team_supers').optional().isArray().withMessage('moveset.team_supers must be an array'),
            (0, express_validator_1.body)('game_rules').optional().isArray().withMessage('game_rules must be an array'),
            (0, express_validator_1.body)('game_rules.*.key').optional().isString().withMessage('game_rules[].key must be a string'),
            (0, express_validator_1.body)('game_rules.*.ui_type').optional().isString().withMessage('game_rules[].ui_type must be a string'),
            (0, express_validator_1.body)('game_rules.*.description').optional().isString(),
            (0, express_validator_1.body)('game_rules.*.metadata').optional().isObject(),
            (0, express_validator_1.body)('legacy_movesets').optional().isArray().withMessage('legacy_movesets must be an array'),
        ];
    }
    /**
     * Validation rules for MongoDB ID parameter
     */
    validateId() {
        return [
            (0, express_validator_1.param)('id')
                .notEmpty()
                .withMessage('Encyclopedia ID is required')
                .matches(/^[0-9a-fA-F]{24}$/)
                .withMessage('Invalid encyclopedia ID format'),
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
     * Validation rules for characterId parameter
     */
    validateCharacterId() {
        return [
            (0, express_validator_1.param)('characterId')
                .notEmpty()
                .withMessage('Character ID is required')
                .isString()
                .matches(/^[a-z0-9_]+$/)
                .withMessage('characterId must contain only lowercase letters, numbers, and underscores'),
        ];
    }
}
exports.CharacterEncyclopediaRoutes = CharacterEncyclopediaRoutes;
//# sourceMappingURL=characterEncyclopediaRoutes.js.map