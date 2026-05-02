import { Request, Response, NextFunction } from 'express';
import { BaseController } from './BaseController';
import { ICharacterEncyclopediaService } from '../services/CharacterEncyclopediaService';
import { IAuditLogRepository } from '../repositories/AuditLogRepository';
/**
 * Character Encyclopedia controller interface
 * Follows Interface Segregation Principle
 */
export interface ICharacterEncyclopediaController {
    createEncyclopedia(req: Request, res: Response, next: NextFunction): Promise<void>;
    getEncyclopediaById(req: Request, res: Response, next: NextFunction): Promise<void>;
    getEncyclopediaByGameAndCharacter(req: Request, res: Response, next: NextFunction): Promise<void>;
    getCurrentEncyclopedia(req: Request, res: Response, next: NextFunction): Promise<void>;
    getEncyclopediasByGame(req: Request, res: Response, next: NextFunction): Promise<void>;
    getGameRules(req: Request, res: Response, next: NextFunction): Promise<void>;
    updateEncyclopedia(req: Request, res: Response, next: NextFunction): Promise<void>;
    updateEncyclopediaByGameAndCharacter(req: Request, res: Response, next: NextFunction): Promise<void>;
    deleteEncyclopedia(req: Request, res: Response, next: NextFunction): Promise<void>;
}
/**
 * Character Encyclopedia controller implementation
 * Follows Single Responsibility Principle - handles HTTP requests/responses for character encyclopedia
 * Follows Dependency Inversion Principle - depends on service interface
 */
export declare class CharacterEncyclopediaController extends BaseController implements ICharacterEncyclopediaController {
    private readonly characterEncyclopediaService;
    private readonly auditLogRepository;
    constructor(characterEncyclopediaService: ICharacterEncyclopediaService, auditLogRepository: IAuditLogRepository);
    /**
     * Create character encyclopedia endpoint handler
     * POST /api/characters/:characterId/encyclopedia
     */
    createEncyclopedia(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get character encyclopedia by MongoDB ID endpoint handler
     * GET /api/encyclopedia/:id
     */
    getEncyclopediaById(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get character encyclopedia by game_id and character_id endpoint handler
     * GET /api/games/:gameId/characters/:characterId/encyclopedia
     */
    getEncyclopediaByGameAndCharacter(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get current character encyclopedia by game_id and character_id endpoint handler (for AI service)
     * GET /api/games/:gameId/characters/:characterId/encyclopedia/current
     */
    getCurrentEncyclopedia(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get all character encyclopedias by game_id endpoint handler
     * GET /api/games/:gameId/encyclopedia
     */
    getEncyclopediasByGame(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get game rules for a character endpoint handler (for AI service)
     * GET /api/games/:gameId/characters/:characterId/encyclopedia/rules
     */
    getGameRules(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Update character encyclopedia by MongoDB ID endpoint handler
     * PUT /api/encyclopedia/:id
     */
    updateEncyclopedia(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Update character encyclopedia by game_id and character_id endpoint handler
     * PUT /api/games/:gameId/characters/:characterId/encyclopedia
     */
    updateEncyclopediaByGameAndCharacter(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Delete character encyclopedia endpoint handler
     * DELETE /api/encyclopedia/:id
     */
    deleteEncyclopedia(req: Request, res: Response, next: NextFunction): Promise<void>;
}
//# sourceMappingURL=CharacterEncyclopediaController.d.ts.map