import { Request, Response, NextFunction } from 'express';
import { BaseController } from './BaseController';
import { IGameService } from '../services/GameService';
import { IAuditLogRepository } from '../repositories/AuditLogRepository';
/**
 * Game controller interface
 * Follows Interface Segregation Principle
 */
export interface IGameController {
    createGame(req: Request, res: Response, next: NextFunction): Promise<void>;
    getGameById(req: Request, res: Response, next: NextFunction): Promise<void>;
    getGameByGameId(req: Request, res: Response, next: NextFunction): Promise<void>;
    updateGame(req: Request, res: Response, next: NextFunction): Promise<void>;
    updateGameByGameId(req: Request, res: Response, next: NextFunction): Promise<void>;
    deleteGame(req: Request, res: Response, next: NextFunction): Promise<void>;
    getActiveGames(req: Request, res: Response, next: NextFunction): Promise<void>;
    findGames(req: Request, res: Response, next: NextFunction): Promise<void>;
    searchGames(req: Request, res: Response, next: NextFunction): Promise<void>;
    activateGame(req: Request, res: Response, next: NextFunction): Promise<void>;
    deactivateGame(req: Request, res: Response, next: NextFunction): Promise<void>;
    refreshCharacterCount(req: Request, res: Response, next: NextFunction): Promise<void>;
}
/**
 * Game controller implementation
 * Follows Single Responsibility Principle - handles HTTP requests/responses for games
 * Follows Dependency Inversion Principle - depends on service interface
 */
export declare class GameController extends BaseController implements IGameController {
    private readonly gameService;
    private readonly auditLogRepository;
    constructor(gameService: IGameService, auditLogRepository: IAuditLogRepository);
    /**
     * Create game endpoint handler
     * POST /api/games
     */
    createGame(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get game by ID endpoint handler
     * GET /api/games/:id
     */
    getGameById(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get game by game_id endpoint handler
     * GET /api/games/game-id/:gameId
     */
    getGameByGameId(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Update game endpoint handler
     * PUT /api/games/:id
     */
    updateGame(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Update game by game_id endpoint handler
     * PUT /api/games/game-id/:gameId
     */
    updateGameByGameId(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Delete game endpoint handler
     * DELETE /api/games/:id
     */
    deleteGame(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get active games endpoint handler (for onboarding)
     * GET /api/games/active
     */
    getActiveGames(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Find games with filters endpoint handler
     * GET /api/games?gameId=...&name=...&publisher=...&isActive=...
     */
    findGames(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Search games endpoint handler
     * GET /api/games/search?q=query
     */
    searchGames(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Activate game endpoint handler
     * PATCH /api/games/:id/activate
     */
    activateGame(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Deactivate game endpoint handler
     * PATCH /api/games/:id/deactivate
     */
    deactivateGame(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Refresh character count endpoint handler
     * PATCH /api/games/game-id/:gameId/refresh-character-count
     */
    refreshCharacterCount(req: Request, res: Response, next: NextFunction): Promise<void>;
}
//# sourceMappingURL=GameController.d.ts.map