"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameMetadataRoutes = void 0;
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const validationMiddleware_1 = require("../middleware/validationMiddleware");
/**
 * Game Metadata routes
 * Follows Single Responsibility Principle - handles routing for game metadata endpoints
 */
class GameMetadataRoutes {
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
        // POST /api/games/:gameId/metadata - Create metadata
        this.router.post('/games/:gameId/metadata', this.validateGameId(), this.validateCreateGameMetadata(), validationMiddleware_1.validateRequest, (req, res, next) => this.controller.createGameMetadata(req, res, next));
        // GET /api/games/:gameId/metadata/current - Get current metadata (for AI)
        // Must come before /:version route to avoid route conflicts
        this.router.get('/games/:gameId/metadata/current', this.validateGameId(), validationMiddleware_1.validateRequest, (req, res, next) => this.controller.getCurrentGameMetadata(req, res, next));
        // GET /api/games/:gameId/metadata - Get metadata by game ID
        this.router.get('/games/:gameId/metadata', this.validateGameId(), validationMiddleware_1.validateRequest, (req, res, next) => this.controller.getGameMetadataByGameId(req, res, next));
        // PUT /api/games/:gameId/metadata - Update metadata by game ID
        this.router.put('/games/:gameId/metadata', this.validateGameId(), this.validateUpdateGameMetadata(), validationMiddleware_1.validateRequest, (req, res, next) => this.controller.updateGameMetadataByGameId(req, res, next));
        // GET /api/metadata/:id - Get metadata by MongoDB ID
        this.router.get('/metadata/:id', this.validateId(), validationMiddleware_1.validateRequest, (req, res, next) => this.controller.getGameMetadataById(req, res, next));
        // PUT /api/metadata/:id - Update metadata by MongoDB ID
        this.router.put('/metadata/:id', this.validateId(), this.validateUpdateGameMetadata(), validationMiddleware_1.validateRequest, (req, res, next) => this.controller.updateGameMetadata(req, res, next));
        // DELETE /api/metadata/:id - Delete metadata
        this.router.delete('/metadata/:id', this.validateId(), validationMiddleware_1.validateRequest, (req, res, next) => this.controller.deleteGameMetadata(req, res, next));
    }
    /**
     * Get router instance
     */
    getRouter() {
        return this.router;
    }
    /**
     * Validation rules for create game metadata
     */
    validateCreateGameMetadata() {
        return [
            (0, express_validator_1.body)('global_mechanics')
                .notEmpty()
                .withMessage('global_mechanics is required')
                .isArray()
                .withMessage('global_mechanics must be an array'),
            (0, express_validator_1.body)('global_mechanics.*.key')
                .notEmpty()
                .withMessage('global_mechanics[].key is required')
                .isString()
                .withMessage('global_mechanics[].key must be a string'),
            (0, express_validator_1.body)('global_mechanics.*.value')
                .notEmpty()
                .withMessage('global_mechanics[].value is required'),
            (0, express_validator_1.body)('global_mechanics.*.ui_type')
                .notEmpty()
                .withMessage('global_mechanics[].ui_type is required')
                .isString()
                .withMessage('global_mechanics[].ui_type must be a string'),
            (0, express_validator_1.body)('global_mechanics.*.description').optional().isString(),
            (0, express_validator_1.body)('global_mechanics.*.metadata').optional().isObject(),
            (0, express_validator_1.body)('constants')
                .notEmpty()
                .withMessage('constants is required')
                .isObject()
                .withMessage('constants must be an object'),
            (0, express_validator_1.body)('constants.team_size').optional().isInt({ min: 1 }).withMessage('team_size must be a positive integer'),
            (0, express_validator_1.body)('constants.has_air_dash').optional().isBoolean().withMessage('has_air_dash must be a boolean'),
            (0, express_validator_1.body)('constants.has_3d_movement').optional().isBoolean().withMessage('has_3d_movement must be a boolean'),
            (0, express_validator_1.body)('constants.has_assists').optional().isBoolean().withMessage('has_assists must be a boolean'),
            (0, express_validator_1.body)('constants.has_dhc').optional().isBoolean().withMessage('has_dhc must be a boolean'),
            (0, express_validator_1.body)('constants.has_team_supers').optional().isBoolean().withMessage('has_team_supers must be a boolean'),
            (0, express_validator_1.body)('constants.max_meter').optional().isInt({ min: 0 }).withMessage('max_meter must be a non-negative integer'),
            (0, express_validator_1.body)('patch_version').optional().isString(),
            (0, express_validator_1.body)('is_current').optional().isBoolean().withMessage('is_current must be a boolean'),
        ];
    }
    /**
     * Validation rules for update game metadata
     */
    validateUpdateGameMetadata() {
        return [
            (0, express_validator_1.body)('global_mechanics')
                .optional()
                .isArray()
                .withMessage('global_mechanics must be an array'),
            (0, express_validator_1.body)('global_mechanics.*.key')
                .optional()
                .isString()
                .withMessage('global_mechanics[].key must be a string'),
            (0, express_validator_1.body)('global_mechanics.*.ui_type')
                .optional()
                .isString()
                .withMessage('global_mechanics[].ui_type must be a string'),
            (0, express_validator_1.body)('global_mechanics.*.description').optional().isString(),
            (0, express_validator_1.body)('global_mechanics.*.metadata').optional().isObject(),
            (0, express_validator_1.body)('constants').optional().isObject().withMessage('constants must be an object'),
            (0, express_validator_1.body)('constants.team_size').optional().isInt({ min: 1 }).withMessage('team_size must be a positive integer'),
            (0, express_validator_1.body)('constants.has_air_dash').optional().isBoolean().withMessage('has_air_dash must be a boolean'),
            (0, express_validator_1.body)('constants.has_3d_movement').optional().isBoolean().withMessage('has_3d_movement must be a boolean'),
            (0, express_validator_1.body)('constants.has_assists').optional().isBoolean().withMessage('has_assists must be a boolean'),
            (0, express_validator_1.body)('constants.has_dhc').optional().isBoolean().withMessage('has_dhc must be a boolean'),
            (0, express_validator_1.body)('constants.has_team_supers').optional().isBoolean().withMessage('has_team_supers must be a boolean'),
            (0, express_validator_1.body)('constants.max_meter').optional().isInt({ min: 0 }).withMessage('max_meter must be a non-negative integer'),
            (0, express_validator_1.body)('patch_version').optional().isString(),
            (0, express_validator_1.body)('is_current').optional().isBoolean().withMessage('is_current must be a boolean'),
        ];
    }
    /**
     * Validation rules for MongoDB ID parameter
     */
    validateId() {
        return [
            (0, express_validator_1.param)('id')
                .notEmpty()
                .withMessage('Metadata ID is required')
                .matches(/^[0-9a-fA-F]{24}$/)
                .withMessage('Invalid metadata ID format'),
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
}
exports.GameMetadataRoutes = GameMetadataRoutes;
//# sourceMappingURL=gameMetadataRoutes.js.map