import { CreateGameRequest, UpdateGameRequest, GameFilters, IGame } from '../types/game';
import { IGameRepository } from '../repositories/GameRepository';
import { ApiResponse } from '../types';
import { BaseService } from './BaseService';
import { ICharacterRepository } from '../repositories/CharacterRepository';
/**
 * Game service interface
 * Follows Interface Segregation Principle
 */
export interface IGameService {
    createGame(request: CreateGameRequest): Promise<ApiResponse<IGame>>;
    getGameById(id: string): Promise<ApiResponse<IGame>>;
    getGameByGameId(gameId: string): Promise<ApiResponse<IGame>>;
    updateGame(id: string, request: UpdateGameRequest): Promise<ApiResponse<IGame>>;
    updateGameByGameId(gameId: string, request: UpdateGameRequest): Promise<ApiResponse<IGame>>;
    deleteGame(id: string): Promise<ApiResponse<boolean>>;
    getActiveGames(): Promise<ApiResponse<IGame[]>>;
    findGames(filters: GameFilters, limit?: number): Promise<ApiResponse<IGame[]>>;
    searchGames(query: string): Promise<ApiResponse<IGame[]>>;
    activateGame(id: string): Promise<ApiResponse<IGame>>;
    deactivateGame(id: string): Promise<ApiResponse<IGame>>;
    refreshCharacterCount(gameId: string): Promise<ApiResponse<IGame>>;
}
/**
 * Game service implementation
 * Follows Single Responsibility Principle - orchestrates game business logic
 * Follows Dependency Inversion Principle - depends on repository interface
 */
export declare class GameService extends BaseService implements IGameService {
    private readonly gameRepository;
    private readonly characterRepository;
    constructor(gameRepository: IGameRepository, characterRepository: ICharacterRepository);
    /**
     * Create new game
     */
    createGame(request: CreateGameRequest): Promise<ApiResponse<IGame>>;
    /**
     * Get game by MongoDB ID
     */
    getGameById(id: string): Promise<ApiResponse<IGame>>;
    /**
     * Get game by game_id
     */
    getGameByGameId(gameId: string): Promise<ApiResponse<IGame>>;
    /**
     * Update game by MongoDB ID
     */
    updateGame(id: string, request: UpdateGameRequest): Promise<ApiResponse<IGame>>;
    /**
     * Update game by game_id
     */
    updateGameByGameId(gameId: string, request: UpdateGameRequest): Promise<ApiResponse<IGame>>;
    /**
     * Delete game
     */
    deleteGame(id: string): Promise<ApiResponse<boolean>>;
    /**
     * Get all active games (for onboarding)
     */
    getActiveGames(): Promise<ApiResponse<IGame[]>>;
    /**
     * Find games with filters
     */
    findGames(filters: GameFilters, limit?: number): Promise<ApiResponse<IGame[]>>;
    /**
     * Search games
     */
    searchGames(query: string): Promise<ApiResponse<IGame[]>>;
    /**
     * Activate game
     */
    activateGame(id: string): Promise<ApiResponse<IGame>>;
    /**
     * Deactivate game
     */
    deactivateGame(id: string): Promise<ApiResponse<IGame>>;
    /**
     * Refresh character count for a game
     */
    refreshCharacterCount(gameId: string): Promise<ApiResponse<IGame>>;
    /**
     * Validate create request
     */
    private validateCreateRequest;
    /**
     * Map document to game interface
     */
    private mapToGame;
}
//# sourceMappingURL=GameService.d.ts.map