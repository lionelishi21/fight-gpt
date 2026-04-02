import { Router } from 'express';
import { body, param, query, ValidationChain } from 'express-validator';
import { GameController } from '../controllers/GameController';
import { validateRequest } from '../middleware/validationMiddleware';

/**
 * Game routes
 * Follows Single Responsibility Principle - handles routing for game endpoints
 */
export class GameRoutes {
  private router: Router;
  private controller: GameController;

  constructor(controller: GameController) {
    this.router = Router();
    this.controller = controller;
    this.setupRoutes();
  }

  /**
   * Setup routes
   */
  private setupRoutes(): void {
    // POST /api/games - Create game
    this.router.post(
      '/',
      this.validateCreateGame(),
      validateRequest,
      (req, res, next) => this.controller.createGame(req, res, next)
    );

    // GET /api/games/active - Get active games (for onboarding)
    this.router.get(
      '/active',
      (req, res, next) => this.controller.getActiveGames(req, res, next)
    );

    // GET /api/games/search - Search games
    this.router.get(
      '/search',
      this.validateSearchGames(),
      validateRequest,
      (req, res, next) => this.controller.searchGames(req, res, next)
    );

    // GET /api/games - Find games with filters
    this.router.get(
      '/',
      this.validateFindGames(),
      validateRequest,
      (req, res, next) => this.controller.findGames(req, res, next)
    );

    // GET /api/games/game-id/:gameId - Get game by game_id
    this.router.get(
      '/game-id/:gameId',
      this.validateGameId(),
      validateRequest,
      (req, res, next) => this.controller.getGameByGameId(req, res, next)
    );

    // PUT /api/games/game-id/:gameId - Update game by game_id
    this.router.put(
      '/game-id/:gameId',
      this.validateGameId(),
      this.validateUpdateGame(),
      validateRequest,
      (req, res, next) => this.controller.updateGameByGameId(req, res, next)
    );

    // PATCH /api/games/game-id/:gameId/refresh-character-count - Refresh character count
    this.router.patch(
      '/game-id/:gameId/refresh-character-count',
      this.validateGameId(),
      validateRequest,
      (req, res, next) => this.controller.refreshCharacterCount(req, res, next)
    );

    // GET /api/games/:id - Get game by MongoDB ID
    this.router.get(
      '/:id',
      this.validateId(),
      validateRequest,
      (req, res, next) => this.controller.getGameById(req, res, next)
    );

    // PUT /api/games/:id - Update game by MongoDB ID
    this.router.put(
      '/:id',
      this.validateId(),
      this.validateUpdateGame(),
      validateRequest,
      (req, res, next) => this.controller.updateGame(req, res, next)
    );

    // PATCH /api/games/:id/activate - Activate game
    this.router.patch(
      '/:id/activate',
      this.validateId(),
      validateRequest,
      (req, res, next) => this.controller.activateGame(req, res, next)
    );

    // PATCH /api/games/:id/deactivate - Deactivate game
    this.router.patch(
      '/:id/deactivate',
      this.validateId(),
      validateRequest,
      (req, res, next) => this.controller.deactivateGame(req, res, next)
    );

    // DELETE /api/games/:id - Delete game
    this.router.delete(
      '/:id',
      this.validateId(),
      validateRequest,
      (req, res, next) => this.controller.deleteGame(req, res, next)
    );
  }

  /**
   * Get router instance
   */
  public getRouter(): Router {
    return this.router;
  }

  /**
   * Validation rules for create game
   */
  private validateCreateGame(): ValidationChain[] {
    return [
      body('game_id')
        .notEmpty()
        .withMessage('game_id is required')
        .isString()
        .matches(/^[a-z0-9_]+$/)
        .withMessage('game_id must contain only lowercase letters, numbers, and underscores'),
      body('name').notEmpty().withMessage('name is required').isString(),
      body('full_name').optional().isString(),
      body('publisher').optional().isString(),
      body('developer').optional().isString(),
      body('release_date').optional().isISO8601().withMessage('release_date must be a valid date'),
      body('genre').optional().isString(),
      body('platform').optional().isArray().withMessage('platform must be an array'),
      body('platform.*').optional().isString(),
      body('icon_url').optional().isURL().withMessage('icon_url must be a valid URL'),
      body('banner_url').optional().isURL().withMessage('banner_url must be a valid URL'),
      body('description').optional().isString(),
      body('is_active').optional().isBoolean().withMessage('is_active must be a boolean'),
      body('latest_version').optional().isString(),
    ];
  }

  /**
   * Validation rules for update game
   */
  private validateUpdateGame(): ValidationChain[] {
    return [
      body('game_id')
        .optional()
        .isString()
        .matches(/^[a-z0-9_]+$/)
        .withMessage('game_id must contain only lowercase letters, numbers, and underscores'),
      body('name').optional().isString(),
      body('full_name').optional().isString(),
      body('publisher').optional().isString(),
      body('developer').optional().isString(),
      body('release_date').optional().isISO8601().withMessage('release_date must be a valid date'),
      body('genre').optional().isString(),
      body('platform').optional().isArray().withMessage('platform must be an array'),
      body('platform.*').optional().isString(),
      body('icon_url').optional().isURL().withMessage('icon_url must be a valid URL'),
      body('banner_url').optional().isURL().withMessage('banner_url must be a valid URL'),
      body('description').optional().isString(),
      body('is_active').optional().isBoolean().withMessage('is_active must be a boolean'),
      body('supported_characters_count')
        .optional()
        .isInt({ min: 0 })
        .withMessage('supported_characters_count must be a non-negative integer'),
      body('latest_version').optional().isString(),
    ];
  }

  /**
   * Validation rules for ID parameter
   */
  private validateId(): ValidationChain[] {
    return [
      param('id')
        .notEmpty()
        .withMessage('Game ID is required')
        .matches(/^[0-9a-fA-F]{24}$/)
        .withMessage('Invalid game ID format'),
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
   * Validation rules for find games query
   */
  private validateFindGames(): ValidationChain[] {
    return [
      query('gameId').optional().isString(),
      query('name').optional().isString(),
      query('publisher').optional().isString(),
      query('developer').optional().isString(),
      query('genre').optional().isString(),
      query('platform').optional().isString(),
      query('isActive')
        .optional()
        .isBoolean()
        .withMessage('isActive must be a boolean')
        .toBoolean(),
      query('limit')
        .optional()
        .isInt({ min: 1, max: 1000 })
        .withMessage('limit must be between 1 and 1000'),
    ];
  }

  /**
   * Validation rules for search games query
   */
  private validateSearchGames(): ValidationChain[] {
    return [
      query('q')
        .notEmpty()
        .withMessage('Search query (q) is required')
        .isString()
        .isLength({ min: 1 })
        .withMessage('Search query must not be empty'),
    ];
  }
}


