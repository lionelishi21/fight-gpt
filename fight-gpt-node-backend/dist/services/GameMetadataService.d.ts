import { CreateGameMetadataRequest, UpdateGameMetadataRequest, IGameMetadata } from '../types/gameMetadata';
import { IGameMetadataRepository } from '../repositories/GameMetadataRepository';
import { ApiResponse } from '../types';
import { BaseService } from './BaseService';
/**
 * Game Metadata service interface
 * Follows Interface Segregation Principle
 */
export interface IGameMetadataService {
    createGameMetadata(request: CreateGameMetadataRequest): Promise<ApiResponse<IGameMetadata>>;
    getGameMetadataById(id: string): Promise<ApiResponse<IGameMetadata>>;
    getGameMetadataByGameId(gameId: string): Promise<ApiResponse<IGameMetadata>>;
    getCurrentGameMetadataByGameId(gameId: string): Promise<ApiResponse<IGameMetadata>>;
    updateGameMetadata(id: string, request: UpdateGameMetadataRequest): Promise<ApiResponse<IGameMetadata>>;
    updateGameMetadataByGameId(gameId: string, request: UpdateGameMetadataRequest): Promise<ApiResponse<IGameMetadata>>;
    deleteGameMetadata(id: string): Promise<ApiResponse<boolean>>;
}
/**
 * Game Metadata service implementation
 * Follows Single Responsibility Principle - orchestrates game metadata business logic
 * Follows Dependency Inversion Principle - depends on repository interface
 */
export declare class GameMetadataService extends BaseService implements IGameMetadataService {
    private readonly gameMetadataRepository;
    constructor(gameMetadataRepository: IGameMetadataRepository);
    /**
     * Create new game metadata
     */
    createGameMetadata(request: CreateGameMetadataRequest): Promise<ApiResponse<IGameMetadata>>;
    /**
     * Get game metadata by MongoDB ID
     */
    getGameMetadataById(id: string): Promise<ApiResponse<IGameMetadata>>;
    /**
     * Get game metadata by game_id
     */
    getGameMetadataByGameId(gameId: string): Promise<ApiResponse<IGameMetadata>>;
    /**
     * Get current game metadata by game_id (for AI service)
     */
    getCurrentGameMetadataByGameId(gameId: string): Promise<ApiResponse<IGameMetadata>>;
    /**
     * Update game metadata by MongoDB ID
     */
    updateGameMetadata(id: string, request: UpdateGameMetadataRequest): Promise<ApiResponse<IGameMetadata>>;
    /**
     * Update game metadata by game_id
     */
    updateGameMetadataByGameId(gameId: string, request: UpdateGameMetadataRequest): Promise<ApiResponse<IGameMetadata>>;
    /**
     * Delete game metadata
     */
    deleteGameMetadata(id: string): Promise<ApiResponse<boolean>>;
    /**
     * Validate create request
     */
    private validateCreateRequest;
    /**
     * Map document to game metadata interface
     */
    private mapToGameMetadata;
}
//# sourceMappingURL=GameMetadataService.d.ts.map