import { Request, Response, NextFunction } from 'express';
import { BaseController } from './BaseController';
import { IGameMetadataService } from '../services/GameMetadataService';
import { IAuditLogRepository } from '../repositories/AuditLogRepository';
/**
 * Game Metadata controller interface
 * Follows Interface Segregation Principle
 */
export interface IGameMetadataController {
    createGameMetadata(req: Request, res: Response, next: NextFunction): Promise<void>;
    getGameMetadataById(req: Request, res: Response, next: NextFunction): Promise<void>;
    getGameMetadataByGameId(req: Request, res: Response, next: NextFunction): Promise<void>;
    getCurrentGameMetadata(req: Request, res: Response, next: NextFunction): Promise<void>;
    updateGameMetadata(req: Request, res: Response, next: NextFunction): Promise<void>;
    updateGameMetadataByGameId(req: Request, res: Response, next: NextFunction): Promise<void>;
    deleteGameMetadata(req: Request, res: Response, next: NextFunction): Promise<void>;
}
/**
 * Game Metadata controller implementation
 * Follows Single Responsibility Principle - handles HTTP requests/responses for game metadata
 * Follows Dependency Inversion Principle - depends on service interface
 */
export declare class GameMetadataController extends BaseController implements IGameMetadataController {
    private readonly gameMetadataService;
    private readonly auditLogRepository;
    constructor(gameMetadataService: IGameMetadataService, auditLogRepository: IAuditLogRepository);
    /**
     * Create game metadata endpoint handler
     * POST /api/games/:gameId/metadata
     */
    createGameMetadata(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get game metadata by MongoDB ID endpoint handler
     * GET /api/metadata/:id
     */
    getGameMetadataById(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get game metadata by game_id endpoint handler
     * GET /api/games/:gameId/metadata
     */
    getGameMetadataByGameId(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get current game metadata by game_id endpoint handler (for AI service)
     * GET /api/games/:gameId/metadata/current
     */
    getCurrentGameMetadata(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Update game metadata by MongoDB ID endpoint handler
     * PUT /api/metadata/:id
     */
    updateGameMetadata(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Update game metadata by game_id endpoint handler
     * PUT /api/games/:gameId/metadata
     */
    updateGameMetadataByGameId(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Delete game metadata endpoint handler
     * DELETE /api/metadata/:id
     */
    deleteGameMetadata(req: Request, res: Response, next: NextFunction): Promise<void>;
}
//# sourceMappingURL=GameMetadataController.d.ts.map