import { BaseRepository } from './BaseRepository';
import { GameMetadata, IGameMetadataDocument } from '../models/GameMetadata';
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
  findActiveGames(): Promise<IGameMetadataDocument[]>;
}

/**
 * Game Metadata repository implementation
 * Follows Single Responsibility Principle - handles only game metadata data operations
 * Follows Dependency Inversion Principle - depends on BaseRepository abstraction
 */
export class GameMetadataRepository
  extends BaseRepository<IGameMetadataDocument>
  implements IGameMetadataRepository
{
  constructor() {
    super(GameMetadata);
  }

  /**
   * Find game metadata by game_id
   */
  async findByGameId(gameId: string): Promise<IGameMetadataDocument | null> {
    try {
      return await this.findOne({ game_id: gameId.toLowerCase().trim() });
    } catch (error) {
      throw this.handleError(error, 'findByGameId');
    }
  }

  /**
   * Find current game metadata by game_id
   * Returns metadata where is_current is true
   */
  async findCurrentByGameId(gameId: string): Promise<IGameMetadataDocument | null> {
    try {
      const normalizedGameId = gameId.toLowerCase().trim();
      return await this.findOne({ game_id: normalizedGameId, is_current: true });
    } catch (error) {
      throw this.handleError(error, 'findCurrentByGameId');
    }
  }

  /**
   * Find game metadata by game_id and patch_version
   */
  async findByGameIdAndVersion(
    gameId: string,
    version: string
  ): Promise<IGameMetadataDocument | null> {
    try {
      const normalizedGameId = gameId.toLowerCase().trim();
      return await this.findOne({
        game_id: normalizedGameId,
        patch_version: version.trim(),
      });
    } catch (error) {
      throw this.handleError(error, 'findByGameIdAndVersion');
    }
  }

  /**
   * Create new game metadata
   */
  async createGameMetadata(data: CreateGameMetadataRequest): Promise<IGameMetadataDocument> {
    try {
      // Normalize game_id to lowercase
      const normalizedData = {
        ...data,
        game_id: data.game_id.toLowerCase().trim(),
        is_current: data.is_current !== undefined ? data.is_current : true,
      };

      return await this.create(normalizedData as Partial<IGameMetadataDocument>);
    } catch (error) {
      throw this.handleError(error, 'createGameMetadata');
    }
  }

  /**
   * Update game metadata by MongoDB ID
   */
  async updateGameMetadata(
    id: string,
    data: UpdateGameMetadataRequest
  ): Promise<IGameMetadataDocument | null> {
    try {
      return await this.update(id, data);
    } catch (error) {
      throw this.handleError(error, 'updateGameMetadata');
    }
  }

  /**
   * Update game metadata by game_id
   */
  async updateGameMetadataByGameId(
    gameId: string,
    data: UpdateGameMetadataRequest
  ): Promise<IGameMetadataDocument | null> {
    try {
      const normalizedGameId = gameId.toLowerCase().trim();

      // Use findOneAndUpdate to update by game_id
      const updated = await this.model
        .findOneAndUpdate({ game_id: normalizedGameId }, data, { new: true })
        .exec();

      if (!updated) {
        return null;
      }

      return updated;
    } catch (error) {
      throw this.handleError(error, 'updateGameMetadataByGameId');
    }
  }

  /**
   * Find all active games (where is_current is true)
   */
  async findActiveGames(): Promise<IGameMetadataDocument[]> {
    try {
      return await this.findMany({ is_current: true });
    } catch (error) {
      throw this.handleError(error, 'findActiveGames');
    }
  }
}
