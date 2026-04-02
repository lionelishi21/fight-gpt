import { BaseRepository } from './BaseRepository';
import { Game, IGameDocument } from '../models/Game';
import { CreateGameRequest, UpdateGameRequest, GameFilters } from '../types/game';

/**
 * Game repository interface
 * Follows Interface Segregation Principle
 */
export interface IGameRepository {
  findByGameId(gameId: string): Promise<IGameDocument | null>;
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
  incrementCharacterCount(gameId: string): Promise<IGameDocument | null>;
  decrementCharacterCount(gameId: string): Promise<IGameDocument | null>;
  updateCharacterCount(gameId: string, count: number): Promise<IGameDocument | null>;
  refreshCharacterCount(gameId: string, characterCount: number): Promise<IGameDocument | null>;
}

/**
 * Game repository implementation
 * Follows Single Responsibility Principle - handles only game data operations
 */
export class GameRepository
  extends BaseRepository<IGameDocument>
  implements IGameRepository
{
  constructor() {
    super(Game);
  }

  /**
   * Find game by game_id
   */
  async findByGameId(gameId: string): Promise<IGameDocument | null> {
    return this.findOne({ game_id: gameId.toLowerCase().trim() });
  }

  /**
   * Find all active games
   */
  async findActiveGames(): Promise<IGameDocument[]> {
    return this.findMany({ is_active: true }, { sort: { name: 1 } });
  }

  /**
   * Find games by name (partial match)
   */
  async findByName(name: string): Promise<IGameDocument[]> {
    return this.findMany(
      { name: { $regex: name, $options: 'i' } },
      { sort: { name: 1 } }
    );
  }

  /**
   * Find games by publisher
   */
  async findByPublisher(publisher: string): Promise<IGameDocument[]> {
    return this.findMany(
      { publisher: { $regex: publisher, $options: 'i' } },
      { sort: { name: 1 } }
    );
  }

  /**
   * Find games by developer
   */
  async findByDeveloper(developer: string): Promise<IGameDocument[]> {
    return this.findMany(
      { developer: { $regex: developer, $options: 'i' } },
      { sort: { name: 1 } }
    );
  }

  /**
   * Find games by platform
   */
  async findByPlatform(platform: string): Promise<IGameDocument[]> {
    return this.findMany(
      { platform: { $in: [platform] } },
      { sort: { name: 1 } }
    );
  }

  /**
   * Create new game
   */
  async createGame(data: CreateGameRequest): Promise<IGameDocument> {
    // Normalize game_id to lowercase
    const normalizedData = {
      ...data,
      game_id: data.game_id.toLowerCase().trim(),
    };

    return this.create(normalizedData as Partial<IGameDocument>);
  }

  /**
   * Update game by ID
   */
  async updateGame(id: string, data: UpdateGameRequest): Promise<IGameDocument | null> {
    // Normalize game_id if provided
    const updateData = { ...data };
    if (updateData.game_id) {
      updateData.game_id = updateData.game_id.toLowerCase().trim();
    }

    return this.update(id, updateData);
  }

  /**
   * Update game by game_id
   */
  async updateGameByGameId(
    gameId: string,
    data: UpdateGameRequest
  ): Promise<IGameDocument | null> {
    const normalizedGameId = gameId.toLowerCase().trim();
    const updateData = { ...data };
    if (updateData.game_id) {
      updateData.game_id = updateData.game_id.toLowerCase().trim();
    }

    try {
      return await this.model
        .findOneAndUpdate({ game_id: normalizedGameId }, updateData, { new: true })
        .exec();
    } catch (error) {
      throw this.handleError(error, 'updateGameByGameId');
    }
  }

  /**
   * Search games by text query
   */
  async searchGames(query: string): Promise<IGameDocument[]> {
    try {
      // Try text search first
      const searchFilter: any = { $text: { $search: query } };
      return this.findMany(searchFilter, { sort: { score: { $meta: 'textScore' } } });
    } catch (error) {
      // Fallback to regex search if text index is not available
      const regexFilter: any = {
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { full_name: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
          { game_id: { $regex: query, $options: 'i' } },
        ],
      };
      return this.findMany(regexFilter, { sort: { name: 1 } });
    }
  }

  /**
   * Find games with filters
   */
  async findWithFilters(filters: GameFilters, limit?: number): Promise<IGameDocument[]> {
    const query: any = {};

    if (filters.game_id) {
      query.game_id = filters.game_id.toLowerCase().trim();
    }
    if (filters.name) {
      query.name = { $regex: filters.name, $options: 'i' };
    }
    if (filters.publisher) {
      query.publisher = { $regex: filters.publisher, $options: 'i' };
    }
    if (filters.developer) {
      query.developer = { $regex: filters.developer, $options: 'i' };
    }
    if (filters.genre) {
      query.genre = { $regex: filters.genre, $options: 'i' };
    }
    if (filters.platform) {
      query.platform = { $in: [filters.platform] };
    }
    if (filters.is_active !== undefined) {
      query.is_active = filters.is_active;
    }

    const options: { sort?: Record<string, 1 | -1>; limit?: number } = {
      sort: { name: 1 },
    };

    if (limit) {
      options.limit = limit;
    }

    return this.findMany(query, options);
  }

  /**
   * Increment character count for a game
   */
  async incrementCharacterCount(gameId: string): Promise<IGameDocument | null> {
    try {
      const normalizedGameId = gameId.toLowerCase().trim();
      return await this.model
        .findOneAndUpdate(
          { game_id: normalizedGameId },
          { $inc: { supported_characters_count: 1 } },
          { new: true }
        )
        .exec();
    } catch (error) {
      throw this.handleError(error, 'incrementCharacterCount');
    }
  }

  /**
   * Decrement character count for a game
   */
  async decrementCharacterCount(gameId: string): Promise<IGameDocument | null> {
    try {
      const normalizedGameId = gameId.toLowerCase().trim();
      return await this.model
        .findOneAndUpdate(
          { game_id: normalizedGameId },
          { $inc: { supported_characters_count: -1 } },
          { new: true }
        )
        .exec();
    } catch (error) {
      throw this.handleError(error, 'decrementCharacterCount');
    }
  }

  /**
   * Update character count for a game
   */
  async updateCharacterCount(gameId: string, count: number): Promise<IGameDocument | null> {
    try {
      const normalizedGameId = gameId.toLowerCase().trim();
      return await this.model
        .findOneAndUpdate(
          { game_id: normalizedGameId },
          { supported_characters_count: count },
          { new: true }
        )
        .exec();
    } catch (error) {
      throw this.handleError(error, 'updateCharacterCount');
    }
  }

  /**
   * Refresh character count for a game (used by service layer after counting characters)
   */
  async refreshCharacterCount(
    gameId: string,
    characterCount: number
  ): Promise<IGameDocument | null> {
    return this.updateCharacterCount(gameId, characterCount);
  }
}

