import { CreateCharacterRequest, UpdateCharacterRequest, CharacterFilters, ICharacter } from '../types/character';
import { ICharacterRepository } from '../repositories/CharacterRepository';
import { ApiResponse } from '../types';
import { BaseService } from './BaseService';
import { IGameRepository } from '../repositories/GameRepository';
/**
 * Character service interface
 * Follows Interface Segregation Principle
 */
export interface ICharacterService {
    createCharacter(request: CreateCharacterRequest): Promise<ApiResponse<ICharacter>>;
    getCharacterById(id: string): Promise<ApiResponse<ICharacter>>;
    updateCharacter(id: string, request: UpdateCharacterRequest): Promise<ApiResponse<ICharacter>>;
    deleteCharacter(id: string): Promise<ApiResponse<boolean>>;
    getCharactersByGame(gameId: string): Promise<ApiResponse<ICharacter[]>>;
    getCurrentCharactersByGame(gameId: string): Promise<ApiResponse<ICharacter[]>>;
    getCharactersByGameAndName(gameId: string, name: string): Promise<ApiResponse<ICharacter[]>>;
    getCharactersByGameAndVersion(gameId: string, version: string): Promise<ApiResponse<ICharacter[]>>;
    getCurrentCharacterByGameAndName(gameId: string, name: string): Promise<ApiResponse<ICharacter>>;
    searchCharacters(query: string, gameId?: string): Promise<ApiResponse<ICharacter[]>>;
    findCharacters(filters: CharacterFilters, limit?: number): Promise<ApiResponse<ICharacter[]>>;
    setCharacterAsCurrent(id: string, isCurrent: boolean): Promise<ApiResponse<ICharacter>>;
}
/**
 * Character service implementation
 * Follows Single Responsibility Principle - orchestrates character business logic
 * Follows Dependency Inversion Principle - depends on repository interface
 */
export declare class CharacterService extends BaseService implements ICharacterService {
    private readonly characterRepository;
    private readonly gameRepository?;
    constructor(characterRepository: ICharacterRepository, gameRepository?: IGameRepository);
    /**
     * Create new character
     */
    createCharacter(request: CreateCharacterRequest): Promise<ApiResponse<ICharacter>>;
    /**
     * Get character by ID
     */
    getCharacterById(id: string): Promise<ApiResponse<ICharacter>>;
    /**
     * Update character
     */
    updateCharacter(id: string, request: UpdateCharacterRequest): Promise<ApiResponse<ICharacter>>;
    /**
     * Delete character
     */
    deleteCharacter(id: string): Promise<ApiResponse<boolean>>;
    /**
     * Get all characters by game ID
     */
    getCharactersByGame(gameId: string): Promise<ApiResponse<ICharacter[]>>;
    /**
     * Get current characters by game
     */
    getCurrentCharactersByGame(gameId: string): Promise<ApiResponse<ICharacter[]>>;
    /**
     * Get characters by game ID and name
     */
    getCharactersByGameAndName(gameId: string, name: string): Promise<ApiResponse<ICharacter[]>>;
    /**
     * Get characters by game ID and version
     */
    getCharactersByGameAndVersion(gameId: string, version: string): Promise<ApiResponse<ICharacter[]>>;
    /**
     * Get current character by game and name
     */
    getCurrentCharacterByGameAndName(gameId: string, name: string): Promise<ApiResponse<ICharacter>>;
    /**
     * Search characters
     */
    searchCharacters(query: string, gameId?: string): Promise<ApiResponse<ICharacter[]>>;
    /**
     * Find characters with filters
     */
    findCharacters(filters: CharacterFilters, limit?: number): Promise<ApiResponse<ICharacter[]>>;
    /**
     * Set character as current/not current
     */
    setCharacterAsCurrent(id: string, isCurrent: boolean): Promise<ApiResponse<ICharacter>>;
    /**
     * Unset current flag for all characters except the specified one
     */
    private unsetCurrentCharacters;
    /**
     * Validate create request
     */
    private validateCreateRequest;
    /**
     * Map document to character interface
     */
    private mapToCharacter;
}
//# sourceMappingURL=CharacterService.d.ts.map