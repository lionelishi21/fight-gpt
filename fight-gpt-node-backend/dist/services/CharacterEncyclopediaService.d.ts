import { CreateCharacterEncyclopediaRequest, UpdateCharacterEncyclopediaRequest, ICharacterEncyclopedia } from '../types/characterEncyclopedia';
import { GameRule } from '../types/gameMetadata';
import { ICharacterEncyclopediaRepository } from '../repositories/CharacterEncyclopediaRepository';
import { ApiResponse } from '../types';
import { BaseService } from './BaseService';
/**
 * Character Encyclopedia service interface
 * Follows Interface Segregation Principle
 */
export interface ICharacterEncyclopediaService {
    createEncyclopedia(request: CreateCharacterEncyclopediaRequest): Promise<ApiResponse<ICharacterEncyclopedia>>;
    getEncyclopediaById(id: string): Promise<ApiResponse<ICharacterEncyclopedia>>;
    getEncyclopediaByGameAndCharacter(gameId: string, characterId: string): Promise<ApiResponse<ICharacterEncyclopedia>>;
    getCurrentEncyclopediaByGameAndCharacter(gameId: string, characterId: string): Promise<ApiResponse<ICharacterEncyclopedia>>;
    getEncyclopediasByGame(gameId: string): Promise<ApiResponse<ICharacterEncyclopedia[]>>;
    updateEncyclopedia(id: string, request: UpdateCharacterEncyclopediaRequest): Promise<ApiResponse<ICharacterEncyclopedia>>;
    updateEncyclopediaByGameAndCharacter(gameId: string, characterId: string, request: UpdateCharacterEncyclopediaRequest): Promise<ApiResponse<ICharacterEncyclopedia>>;
    deleteEncyclopedia(id: string): Promise<ApiResponse<boolean>>;
    getGameRules(gameId: string, characterId: string): Promise<ApiResponse<GameRule[]>>;
}
/**
 * Character Encyclopedia service implementation
 * Follows Single Responsibility Principle - orchestrates character encyclopedia business logic
 * Follows Dependency Inversion Principle - depends on repository interface
 */
export declare class CharacterEncyclopediaService extends BaseService implements ICharacterEncyclopediaService {
    private readonly characterEncyclopediaRepository;
    constructor(characterEncyclopediaRepository: ICharacterEncyclopediaRepository);
    /**
     * Create new character encyclopedia
     */
    createEncyclopedia(request: CreateCharacterEncyclopediaRequest): Promise<ApiResponse<ICharacterEncyclopedia>>;
    /**
     * Get character encyclopedia by MongoDB ID
     */
    getEncyclopediaById(id: string): Promise<ApiResponse<ICharacterEncyclopedia>>;
    /**
     * Get character encyclopedia by game_id and character_id
     */
    getEncyclopediaByGameAndCharacter(gameId: string, characterId: string): Promise<ApiResponse<ICharacterEncyclopedia>>;
    /**
     * Get current character encyclopedia by game_id and character_id (for AI service)
     */
    getCurrentEncyclopediaByGameAndCharacter(gameId: string, characterId: string): Promise<ApiResponse<ICharacterEncyclopedia>>;
    /**
     * Get all character encyclopedias by game_id
     */
    getEncyclopediasByGame(gameId: string): Promise<ApiResponse<ICharacterEncyclopedia[]>>;
    /**
     * Update character encyclopedia by MongoDB ID
     */
    updateEncyclopedia(id: string, request: UpdateCharacterEncyclopediaRequest): Promise<ApiResponse<ICharacterEncyclopedia>>;
    /**
     * Update character encyclopedia by game_id and character_id
     */
    updateEncyclopediaByGameAndCharacter(gameId: string, characterId: string, request: UpdateCharacterEncyclopediaRequest): Promise<ApiResponse<ICharacterEncyclopedia>>;
    /**
     * Delete character encyclopedia
     */
    deleteEncyclopedia(id: string): Promise<ApiResponse<boolean>>;
    /**
     * Get game rules for a character (for AI service)
     * Extracts game_rules from the current encyclopedia
     */
    getGameRules(gameId: string, characterId: string): Promise<ApiResponse<GameRule[]>>;
    /**
     * Validate create request
     */
    private validateCreateRequest;
    /**
     * Map document to character encyclopedia interface
     */
    private mapToCharacterEncyclopedia;
}
//# sourceMappingURL=CharacterEncyclopediaService.d.ts.map