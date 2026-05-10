import { Request, Response, NextFunction } from 'express';
import { BaseController } from './BaseController';
import { ICharacterService } from '../services/CharacterService';
import { IAuditLogRepository } from '../repositories/AuditLogRepository';
/**
 * Character controller interface
 * Follows Interface Segregation Principle
 */
export interface ICharacterController {
    createCharacter(req: Request, res: Response, next: NextFunction): Promise<void>;
    getCharacterById(req: Request, res: Response, next: NextFunction): Promise<void>;
    updateCharacter(req: Request, res: Response, next: NextFunction): Promise<void>;
    deleteCharacter(req: Request, res: Response, next: NextFunction): Promise<void>;
    getCharactersByGame(req: Request, res: Response, next: NextFunction): Promise<void>;
    getCurrentCharactersByGame(req: Request, res: Response, next: NextFunction): Promise<void>;
    getCharactersByGameAndName(req: Request, res: Response, next: NextFunction): Promise<void>;
    getCharactersByGameAndVersion(req: Request, res: Response, next: NextFunction): Promise<void>;
    getCurrentCharacterByGameAndName(req: Request, res: Response, next: NextFunction): Promise<void>;
    searchCharacters(req: Request, res: Response, next: NextFunction): Promise<void>;
    findCharacters(req: Request, res: Response, next: NextFunction): Promise<void>;
    setCharacterAsCurrent(req: Request, res: Response, next: NextFunction): Promise<void>;
    getProsByGame(req: Request, res: Response, next: NextFunction): Promise<void>;
}
/**
 * Character controller implementation
 * Follows Single Responsibility Principle - handles HTTP requests/responses for characters
 * Follows Dependency Inversion Principle - depends on service interface
 */
export declare class CharacterController extends BaseController implements ICharacterController {
    private readonly characterService;
    private readonly auditLogRepository;
    constructor(characterService: ICharacterService, auditLogRepository: IAuditLogRepository);
    /**
     * Create character endpoint handler
     * POST /api/characters
     */
    createCharacter(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get character by ID endpoint handler
     * GET /api/characters/:id
     */
    getCharacterById(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Update character endpoint handler
     * PUT /api/characters/:id
     */
    updateCharacter(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Delete character endpoint handler
     * DELETE /api/characters/:id
     */
    deleteCharacter(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get characters by game endpoint handler
     * GET /api/characters/game/:gameId
     */
    getCharactersByGame(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get current characters by game endpoint handler
     * GET /api/characters/game/:gameId/current
     */
    getCurrentCharactersByGame(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get characters by game and name endpoint handler
     * GET /api/characters/game/:gameId/name/:name
     */
    getCharactersByGameAndName(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get characters by game and version endpoint handler
     * GET /api/characters/game/:gameId/version/:version
     */
    getCharactersByGameAndVersion(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get current character by game and name endpoint handler
     * GET /api/characters/game/:gameId/name/:name/current
     */
    getCurrentCharacterByGameAndName(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Search characters endpoint handler
     * GET /api/characters/search?q=query&gameId=gameId
     */
    searchCharacters(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Find characters with filters endpoint handler
     * GET /api/characters?gameId=...&name=...&version=...&isCurrent=...
     */
    findCharacters(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Set character as current endpoint handler
     * PATCH /api/characters/:id/current
     */
    setCharacterAsCurrent(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get verified pros by game
     * GET /api/characters/game/:gameId/pros
     */
    getProsByGame(req: Request, res: Response, next: NextFunction): Promise<void>;
}
//# sourceMappingURL=CharacterController.d.ts.map