import { BaseRepository } from './BaseRepository';
import { IGameMetadataDocument } from '../models/GameMetadata';
import { CreateGameMetadataRequest, UpdateGameMetadataRequest } from '../types/gameMetadata';
/**
 * Game Metadata repository interface
 * Follows Interface Segregation Principle
 */
export interface IGameMetadataRepository {
    findById(id: string): Promise<IGameMetadataDocument | null>;
    findByGameId(gameId: string): Promise<IGameMetadataDocument | null>;
    findCurrentByGameId(gameId: string): Promise<IGameMetadataDocument | null>;
    findByGameIdAndVersion(gameId: string, version: string): Promise<IGameMetadataDocument | null>;
    createGameMetadata(data: CreateGameMetadataRequest): Promise<IGameMetadataDocument>;
    updateGameMetadata(id: string, data: UpdateGameMetadataRequest): Promise<IGameMetadataDocument | null>;
    updateGameMetadataByGameId(gameId: string, data: UpdateGameMetadataRequest): Promise<IGameMetadataDocument | null>;
    delete(id: string): Promise<boolean>;
}
/**
 * Game Metadata repository implementation
 * Follows Single Responsibility Principle - handles only game metadata data operations
 * Follows Dependency Inversion Principle - depends on BaseRepository abstraction
 */
export declare class GameMetadataRepository extends BaseRepository<IGameMetadataDocument> implements IGameMetadataRepository {
    constructor();
    /**
     * Find game metadata by game_id
     */
    findByGameId(gameId: string): Promise<IGameMetadataDocument | null>;
    /**
     * Find current game metadata by game_id
     * Returns metadata where is_current is true
     */
    findCurrentByGameId(gameId: string): Promise<IGameMetadataDocument | null>;
    /**
     * Find game metadata by game_id and patch_version
     */
    findByGameIdAndVersion(gameId: string, version: string): Promise<IGameMetadataDocument | null>;
    /**
     * Create new game metadata
     */
    createGameMetadata(data: CreateGameMetadataRequest): Promise<IGameMetadataDocument>;
    /**
     * Update game metadata by MongoDB ID
     */
    updateGameMetadata(id: string, data: UpdateGameMetadataRequest): Promise<IGameMetadataDocument | null>;
    /**
     * Update game metadata by game_id
     */
    updateGameMetadataByGameId(gameId: string, data: UpdateGameMetadataRequest): Promise<IGameMetadataDocument | null>;
}
//# sourceMappingURL=GameMetadataRepository.d.ts.map