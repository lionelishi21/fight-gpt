import { BaseRepository } from './BaseRepository';
import { IGameDocument } from '../models/Game';
import { CreateGameRequest, UpdateGameRequest, GameFilters } from '../types/game';
/**
 * Game repository interface
 * Follows Interface Segregation Principle
 */
export interface IGameRepository {
    findByGameId(gameId: string): Promise<IGameDocument | null>;
    findById(id: string): Promise<IGameDocument | null>;
    findActiveGames(): Promise<IGameDocument[]>;
    findByName(name: string): Promise<IGameDocument[]>;
    findByPublisher(publisher: string): Promise<IGameDocument[]>;
    findByDeveloper(developer: string): Promise<IGameDocument[]>;
    findByPlatform(platform: string): Promise<IGameDocument[]>;
    createGame(data: CreateGameRequest): Promise<IGameDocument>;
    updateGame(id: string, data: UpdateGameRequest): Promise<IGameDocument | null>;
    updateGameByGameId(gameId: string, data: UpdateGameRequest): Promise<IGameDocument | null>;
    searchGames(query: string): Promise<IGameDocument[]>;
    findWithFilters(filters: GameFilters, limit?: number): Promise<IGameDocument[]>;
    delete(id: string): Promise<boolean>;
    incrementCharacterCount(gameId: string): Promise<IGameDocument | null>;
    decrementCharacterCount(gameId: string): Promise<IGameDocument | null>;
    updateCharacterCount(gameId: string, count: number): Promise<IGameDocument | null>;
    refreshCharacterCount(gameId: string, characterCount: number): Promise<IGameDocument | null>;
}
/**
 * Game repository implementation
 * Follows Single Responsibility Principle - handles only game data operations
 */
export declare class GameRepository extends BaseRepository<IGameDocument> implements IGameRepository {
    constructor();
    /**
     * Find game by game_id
     */
    findByGameId(gameId: string): Promise<IGameDocument | null>;
    /**
     * Find all active games
     */
    findActiveGames(): Promise<IGameDocument[]>;
    /**
     * Find games by name (partial match)
     */
    findByName(name: string): Promise<IGameDocument[]>;
    /**
     * Find games by publisher
     */
    findByPublisher(publisher: string): Promise<IGameDocument[]>;
    /**
     * Find games by developer
     */
    findByDeveloper(developer: string): Promise<IGameDocument[]>;
    /**
     * Find games by platform
     */
    findByPlatform(platform: string): Promise<IGameDocument[]>;
    /**
     * Create new game
     */
    createGame(data: CreateGameRequest): Promise<IGameDocument>;
    /**
     * Update game by ID
     */
    updateGame(id: string, data: UpdateGameRequest): Promise<IGameDocument | null>;
    /**
     * Update game by game_id
     */
    updateGameByGameId(gameId: string, data: UpdateGameRequest): Promise<IGameDocument | null>;
    /**
     * Search games by text query
     */
    searchGames(query: string): Promise<IGameDocument[]>;
    /**
     * Find games with filters
     */
    findWithFilters(filters: GameFilters, limit?: number): Promise<IGameDocument[]>;
    /**
     * Increment character count for a game
     */
    incrementCharacterCount(gameId: string): Promise<IGameDocument | null>;
    /**
     * Decrement character count for a game
     */
    decrementCharacterCount(gameId: string): Promise<IGameDocument | null>;
    /**
     * Update character count for a game
     */
    updateCharacterCount(gameId: string, count: number): Promise<IGameDocument | null>;
    /**
     * Refresh character count for a game (used by service layer after counting characters)
     */
    refreshCharacterCount(gameId: string, characterCount: number): Promise<IGameDocument | null>;
}
//# sourceMappingURL=GameRepository.d.ts.map