import { Router } from 'express';
import { body, param, ValidationChain } from 'express-validator';
import { CharacterEncyclopediaController } from '../controllers/CharacterEncyclopediaController';
import { validateRequest } from '../middleware/validationMiddleware';

/**
 * Character Encyclopedia routes
 * Follows Single Responsibility Principle - handles routing for character encyclopedia endpoints
 */
export class CharacterEncyclopediaRoutes {
  private router: Router;
  private controller: CharacterEncyclopediaController;

  constructor(controller: CharacterEncyclopediaController) {
    this.router = Router();
    this.controller = controller;
    this.setupRoutes();
  }

  /**
   * Setup routes
   * Note: Order matters - more specific routes must come before less specific ones
   */
  private setupRoutes(): void {
    // POST /api/games/:gameId/characters/:characterId/encyclopedia - Create encyclopedia
    this.router.post(
      '/games/:gameId/characters/:characterId/encyclopedia',
      this.validateGameId(),
      this.validateCharacterId(),
      this.validateCreateEncyclopedia(),
      validateRequest,
      (req, res, next) => this.controller.createEncyclopedia(req, res, next)
    );

    // GET /api/games/:gameId/characters/:characterId/encyclopedia/rules - Get game_rules (for AI)
    // Must come before /current route to avoid route conflicts
    this.router.get(
      '/games/:gameId/characters/:characterId/encyclopedia/rules',
      this.validateGameId(),
      this.validateCharacterId(),
      validateRequest,
      (req, res, next) => this.controller.getGameRules(req, res, next)
    );

    // GET /api/games/:gameId/characters/:characterId/encyclopedia/current - Get current (for AI)
    // Must come before generic encyclopedia route
    this.router.get(
      '/games/:gameId/characters/:characterId/encyclopedia/current',
      this.validateGameId(),
      this.validateCharacterId(),
      validateRequest,
      (req, res, next) => this.controller.getCurrentEncyclopedia(req, res, next)
    );

    // GET /api/games/:gameId/characters/:characterId/encyclopedia - Get encyclopedia by game and character
    this.router.get(
      '/games/:gameId/characters/:characterId/encyclopedia',
      this.validateGameId(),
      this.validateCharacterId(),
      validateRequest,
      (req, res, next) => this.controller.getEncyclopediaByGameAndCharacter(req, res, next)
    );

    // PUT /api/games/:gameId/characters/:characterId/encyclopedia - Update by game and character
    this.router.put(
      '/games/:gameId/characters/:characterId/encyclopedia',
      this.validateGameId(),
      this.validateCharacterId(),
      this.validateUpdateEncyclopedia(),
      validateRequest,
      (req, res, next) => this.controller.updateEncyclopediaByGameAndCharacter(req, res, next)
    );

    // GET /api/games/:gameId/encyclopedia - Get all encyclopedias for game
    this.router.get(
      '/games/:gameId/encyclopedia',
      this.validateGameId(),
      validateRequest,
      (req, res, next) => this.controller.getEncyclopediasByGame(req, res, next)
    );

    // GET /api/encyclopedia/:id - Get by MongoDB ID
    this.router.get(
      '/encyclopedia/:id',
      this.validateId(),
      validateRequest,
      (req, res, next) => this.controller.getEncyclopediaById(req, res, next)
    );

    // PUT /api/encyclopedia/:id - Update by ID
    this.router.put(
      '/encyclopedia/:id',
      this.validateId(),
      this.validateUpdateEncyclopedia(),
      validateRequest,
      (req, res, next) => this.controller.updateEncyclopedia(req, res, next)
    );

    // DELETE /api/encyclopedia/:id - Delete
    this.router.delete(
      '/encyclopedia/:id',
      this.validateId(),
      validateRequest,
      (req, res, next) => this.controller.deleteEncyclopedia(req, res, next)
    );
  }

  /**
   * Get router instance
   */
  public getRouter(): Router {
    return this.router;
  }

  /**
   * Validation rules for create character encyclopedia
   */
  private validateCreateEncyclopedia(): ValidationChain[] {
    return [
      body('patch_version')
        .notEmpty()
        .withMessage('patch_version is required')
        .isString()
        .withMessage('patch_version must be a string'),
      body('is_current_patch').optional().isBoolean().withMessage('is_current_patch must be a boolean'),
      body('moveset')
        .notEmpty()
        .withMessage('moveset is required')
        .isObject()
        .withMessage('moveset must be an object'),
      body('moveset.normals')
        .notEmpty()
        .withMessage('moveset.normals is required')
        .isArray()
        .withMessage('moveset.normals must be an array'),
      body('moveset.specials')
        .notEmpty()
        .withMessage('moveset.specials is required')
        .isArray()
        .withMessage('moveset.specials must be an array'),
      body('moveset.ex_moves')
        .notEmpty()
        .withMessage('moveset.ex_moves is required')
        .isArray()
        .withMessage('moveset.ex_moves must be an array'),
      body('moveset.supers')
        .notEmpty()
        .withMessage('moveset.supers is required')
        .isArray()
        .withMessage('moveset.supers must be an array'),
      body('moveset.assists').optional().isArray().withMessage('moveset.assists must be an array'),
      body('moveset.dhc').optional().isArray().withMessage('moveset.dhc must be an array'),
      body('moveset.team_supers').optional().isArray().withMessage('moveset.team_supers must be an array'),
      body('game_rules')
        .notEmpty()
        .withMessage('game_rules is required')
        .isArray()
        .withMessage('game_rules must be an array'),
      body('game_rules.*.key')
        .notEmpty()
        .withMessage('game_rules[].key is required')
        .isString()
        .withMessage('game_rules[].key must be a string'),
      body('game_rules.*.value')
        .notEmpty()
        .withMessage('game_rules[].value is required'),
      body('game_rules.*.ui_type')
        .notEmpty()
        .withMessage('game_rules[].ui_type is required')
        .isString()
        .withMessage('game_rules[].ui_type must be a string'),
      body('game_rules.*.description').optional().isString(),
      body('game_rules.*.metadata').optional().isObject(),
      body('legacy_movesets').optional().isArray().withMessage('legacy_movesets must be an array'),
    ];
  }

  /**
   * Validation rules for update character encyclopedia
   */
  private validateUpdateEncyclopedia(): ValidationChain[] {
    return [
      body('patch_version').optional().isString().withMessage('patch_version must be a string'),
      body('is_current_patch').optional().isBoolean().withMessage('is_current_patch must be a boolean'),
      body('moveset').optional().isObject().withMessage('moveset must be an object'),
      body('moveset.normals').optional().isArray().withMessage('moveset.normals must be an array'),
      body('moveset.specials').optional().isArray().withMessage('moveset.specials must be an array'),
      body('moveset.ex_moves').optional().isArray().withMessage('moveset.ex_moves must be an array'),
      body('moveset.supers').optional().isArray().withMessage('moveset.supers must be an array'),
      body('moveset.assists').optional().isArray().withMessage('moveset.assists must be an array'),
      body('moveset.dhc').optional().isArray().withMessage('moveset.dhc must be an array'),
      body('moveset.team_supers').optional().isArray().withMessage('moveset.team_supers must be an array'),
      body('game_rules').optional().isArray().withMessage('game_rules must be an array'),
      body('game_rules.*.key').optional().isString().withMessage('game_rules[].key must be a string'),
      body('game_rules.*.ui_type').optional().isString().withMessage('game_rules[].ui_type must be a string'),
      body('game_rules.*.description').optional().isString(),
      body('game_rules.*.metadata').optional().isObject(),
      body('legacy_movesets').optional().isArray().withMessage('legacy_movesets must be an array'),
    ];
  }

  /**
   * Validation rules for MongoDB ID parameter
   */
  private validateId(): ValidationChain[] {
    return [
      param('id')
        .notEmpty()
        .withMessage('Encyclopedia ID is required')
        .matches(/^[0-9a-fA-F]{24}$/)
        .withMessage('Invalid encyclopedia ID format'),
    ];
  }

  /**
   * Validation rules for gameId parameter
   */
  private validateGameId(): ValidationChain[] {
    return [
      param('gameId')
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
  private validateCharacterId(): ValidationChain[] {
    return [
      param('characterId')
        .notEmpty()
        .withMessage('Character ID is required')
        .isString()
        .matches(/^[a-z0-9_]+$/)
        .withMessage('characterId must contain only lowercase letters, numbers, and underscores'),
    ];
  }
}
