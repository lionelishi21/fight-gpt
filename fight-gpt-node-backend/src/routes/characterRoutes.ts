import { Router } from 'express';
import {
  body,
  param,
  query,
  ValidationChain,
} from 'express-validator';
import { CharacterController } from '../controllers/CharacterController';
import { validateRequest } from '../middleware/validationMiddleware';

/**
 * Character routes
 * Follows Single Responsibility Principle - handles routing for character endpoints
 */
export class CharacterRoutes {
  private router: Router;
  private controller: CharacterController;

  constructor(controller: CharacterController) {
    this.router = Router();
    this.controller = controller;
    this.setupRoutes();
  }

  /**
   * Setup routes
   */
  private setupRoutes(): void {
    // POST /api/characters - Create character
    this.router.post(
      '/',
      this.validateCreateCharacter(),
      validateRequest,
      (req, res, next) => this.controller.createCharacter(req, res, next)
    );

    // GET /api/characters - Find characters with filters
    this.router.get(
      '/',
      this.validateFindCharacters(),
      validateRequest,
      (req, res, next) => this.controller.findCharacters(req, res, next)
    );

    // GET /api/characters/search - Search characters
    this.router.get(
      '/search',
      this.validateSearchCharacters(),
      validateRequest,
      (req, res, next) => this.controller.searchCharacters(req, res, next)
    );

    // GET /api/characters/game/:gameId - Get all characters by game
    this.router.get(
      '/game/:gameId',
      this.validateGameId(),
      validateRequest,
      (req, res, next) => this.controller.getCharactersByGame(req, res, next)
    );

    // GET /api/characters/game/:gameId/current - Get current characters by game
    this.router.get(
      '/game/:gameId/current',
      this.validateGameId(),
      validateRequest,
      (req, res, next) => this.controller.getCurrentCharactersByGame(req, res, next)
    );

    // GET /api/characters/game/:gameId/name/:name - Get characters by game and name
    this.router.get(
      '/game/:gameId/name/:name',
      this.validateGameIdAndName(),
      validateRequest,
      (req, res, next) => this.controller.getCharactersByGameAndName(req, res, next)
    );

    // GET /api/characters/game/:gameId/name/:name/current - Get current character by game and name
    this.router.get(
      '/game/:gameId/name/:name/current',
      this.validateGameIdAndName(),
      validateRequest,
      (req, res, next) => this.controller.getCurrentCharacterByGameAndName(req, res, next)
    );

    // GET /api/characters/game/:gameId/version/:version - Get characters by game and version
    this.router.get(
      '/game/:gameId/version/:version',
      this.validateGameIdAndVersion(),
      validateRequest,
      (req, res, next) => this.controller.getCharactersByGameAndVersion(req, res, next)
    );

    // GET /api/characters/:id - Get character by ID
    this.router.get(
      '/:id',
      this.validateId(),
      validateRequest,
      (req, res, next) => this.controller.getCharacterById(req, res, next)
    );

    // PUT /api/characters/:id - Update character
    this.router.put(
      '/:id',
      this.validateId(),
      this.validateUpdateCharacter(),
      validateRequest,
      (req, res, next) => this.controller.updateCharacter(req, res, next)
    );

    // PATCH /api/characters/:id/current - Set character as current
    this.router.patch(
      '/:id/current',
      this.validateId(),
      this.validateSetCurrent(),
      validateRequest,
      (req, res, next) => this.controller.setCharacterAsCurrent(req, res, next)
    );

    // DELETE /api/characters/:id - Delete character
    this.router.delete(
      '/:id',
      this.validateId(),
      validateRequest,
      (req, res, next) => this.controller.deleteCharacter(req, res, next)
    );
    // GET /api/characters/game/:gameId/pros - Get verified pro players by game
    this.router.get(
      '/game/:gameId/pros',
      this.validateGameId(),
      validateRequest,
      (req, res, next) => this.controller.getProsByGame(req, res, next)
    );
  }

  /**
   * Get router instance
   */
  public getRouter(): Router {
    return this.router;
  }

  /**
   * Validation rules for create character
   */
  private validateCreateCharacter(): ValidationChain[] {
    return [
      body('game_id').notEmpty().withMessage('game_id is required').isString(),
      body('name').notEmpty().withMessage('name is required').isString(),
      body('version').notEmpty().withMessage('version is required').isString(),
      body('is_current').isBoolean().withMessage('is_current must be a boolean'),
      body('stats').isObject().withMessage('stats must be an object'),
      body('moves')
        .isArray()
        .withMessage('moves must be an array')
        .custom((moves) => {
          if (!Array.isArray(moves)) return false;
          for (const move of moves) {
            if (!move.id || !move.name || move.startup === undefined || move.active === undefined || move.recovery === undefined || move.on_block === undefined) {
              return false;
            }
          }
          return true;
        })
        .withMessage('Each move must have id, name, startup, active, recovery, and on_block'),
      body('patch_notes_summary').optional().isString(),
    ];
  }

  /**
   * Validation rules for update character
   */
  private validateUpdateCharacter(): ValidationChain[] {
    return [
      body('game_id').optional().isString(),
      body('name').optional().isString(),
      body('version').optional().isString(),
      body('is_current').optional().isBoolean(),
      body('stats').optional().isObject(),
      body('moves')
        .optional()
        .isArray()
        .custom((moves) => {
          if (!Array.isArray(moves)) return false;
          for (const move of moves) {
            if (!move.id || !move.name || move.startup === undefined || move.active === undefined || move.recovery === undefined || move.on_block === undefined) {
              return false;
            }
          }
          return true;
        })
        .withMessage('Each move must have id, name, startup, active, recovery, and on_block'),
      body('patch_notes_summary').optional().isString(),
    ];
  }

  /**
   * Validation rules for ID parameter
   */
  private validateId(): ValidationChain[] {
    return [
      param('id')
        .notEmpty()
        .withMessage('Character ID is required')
        .matches(/^[0-9a-fA-F]{24}$/)
        .withMessage('Invalid character ID format'),
    ];
  }

  /**
   * Validation rules for gameId parameter
   */
  private validateGameId(): ValidationChain[] {
    return [param('gameId').notEmpty().withMessage('Game ID is required').isString()];
  }

  /**
   * Validation rules for gameId and name parameters
   */
  private validateGameIdAndName(): ValidationChain[] {
    return [
      param('gameId').notEmpty().withMessage('Game ID is required').isString(),
      param('name').notEmpty().withMessage('Character name is required').isString(),
    ];
  }

  /**
   * Validation rules for gameId and version parameters
   */
  private validateGameIdAndVersion(): ValidationChain[] {
    return [
      param('gameId').notEmpty().withMessage('Game ID is required').isString(),
      param('version').notEmpty().withMessage('Version is required').isString(),
    ];
  }

  /**
   * Validation rules for find characters query
   */
  private validateFindCharacters(): ValidationChain[] {
    return [
      query('gameId').optional().isString(),
      query('name').optional().isString(),
      query('version').optional().isString(),
      query('isCurrent').optional().isBoolean().withMessage('isCurrent must be a boolean'),
      query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('limit must be between 1 and 1000'),
    ];
  }

  /**
   * Validation rules for search characters query
   */
  private validateSearchCharacters(): ValidationChain[] {
    return [
      query('q').notEmpty().withMessage('Search query (q) is required').isString(),
      query('gameId').optional().isString(),
    ];
  }

  /**
   * Validation rules for set current
   */
  private validateSetCurrent(): ValidationChain[] {
    return [
      body('isCurrent').notEmpty().withMessage('isCurrent is required').isBoolean().withMessage('isCurrent must be a boolean'),
    ];
  }
}

