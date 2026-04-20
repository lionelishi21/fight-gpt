import { BaseRepository } from './BaseRepository';
import { Character, ICharacterDocument } from '../models/Character';
import { CreateCharacterRequest, UpdateCharacterRequest, CharacterFilters } from '../types/character';

/**
 * Character repository interface
 * Follows Interface Segregation Principle
 */
export interface ICharacterRepository {
  findByGameId(gameId: string): Promise<ICharacterDocument[]>;
  findById(id: string): Promise<ICharacterDocument | null>;
  findByGameIdAndName(gameId: string, name: string): Promise<ICharacterDocument[]>;
  findCurrentCharactersByGame(gameId: string): Promise<ICharacterDocument[]>;
  findByGameIdAndVersion(gameId: string, version: string): Promise<ICharacterDocument[]>;
  findCurrentCharacterByGameAndName(gameId: string, name: string): Promise<ICharacterDocument | null>;
  createCharacter(data: CreateCharacterRequest): Promise<ICharacterDocument>;
  updateCharacter(id: string, data: UpdateCharacterRequest): Promise<ICharacterDocument | null>;
  searchCharacters(query: string, gameId?: string): Promise<ICharacterDocument[]>;
  findWithFilters(filters: CharacterFilters, limit?: number): Promise<ICharacterDocument[]>;
  exists(filter: object): Promise<boolean>;
  delete(id: string): Promise<boolean>;
}

/**
 * Character repository implementation
 * Follows Single Responsibility Principle - handles only character data operations
 */
export class CharacterRepository
  extends BaseRepository<ICharacterDocument>
  implements ICharacterRepository
{
  constructor() {
    super(Character);
  }

  /**
   * Find all characters by game ID
   */
  async findByGameId(gameId: string): Promise<ICharacterDocument[]> {
    return this.findMany({ game_id: gameId }, { sort: { name: 1 } });
  }

  /**
   * Find characters by game ID and name
   */
  async findByGameIdAndName(gameId: string, name: string): Promise<ICharacterDocument[]> {
    return this.findMany({ game_id: gameId, name }, { sort: { version: -1 } });
  }

  /**
   * Find current characters by game
   */
  async findCurrentCharactersByGame(gameId: string): Promise<ICharacterDocument[]> {
    return this.findMany({ game_id: gameId, is_current: true }, { sort: { name: 1 } });
  }

  /**
   * Find characters by game ID and version
   */
  async findByGameIdAndVersion(gameId: string, version: string): Promise<ICharacterDocument[]> {
    return this.findMany({ game_id: gameId, version }, { sort: { name: 1 } });
  }

  /**
   * Find current character by game and name
   */
  async findCurrentCharacterByGameAndName(
    gameId: string,
    name: string
  ): Promise<ICharacterDocument | null> {
    return this.findOne({ game_id: gameId, name, is_current: true });
  }

  /**
   * Create new character
   */
  async createCharacter(data: CreateCharacterRequest): Promise<ICharacterDocument> {
    return this.create(data as Partial<ICharacterDocument>);
  }

  /**
   * Update character by ID
   */
  async updateCharacter(
    id: string,
    data: UpdateCharacterRequest
  ): Promise<ICharacterDocument | null> {
    return this.update(id, data);
  }

  /**
   * Search characters by text query
   */
  async searchCharacters(query: string, gameId?: string): Promise<ICharacterDocument[]> {
    try {
      const searchFilter: any = { $text: { $search: query } };
      if (gameId) {
        searchFilter.game_id = gameId;
      }

      return this.findMany(searchFilter, { sort: { score: { $meta: 'textScore' } } as any });
    } catch (error) {
      // Fallback to regex search if text index is not available
      const regexFilter: any = {
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { patch_notes_summary: { $regex: query, $options: 'i' } },
        ],
      };
      if (gameId) {
        regexFilter.game_id = gameId;
      }
      return this.findMany(regexFilter, { sort: { name: 1 } });
    }
  }

  /**
   * Find characters with filters
   */
  async findWithFilters(filters: CharacterFilters, limit?: number): Promise<ICharacterDocument[]> {
    const query: any = {};

    if (filters.game_id) {
      query.game_id = filters.game_id;
    }
    if (filters.name) {
      query.name = filters.name;
    }
    if (filters.version) {
      query.version = filters.version;
    }
    if (filters.is_current !== undefined) {
      query.is_current = filters.is_current;
    }

    const options: { sort?: Record<string, 1 | -1>; limit?: number } = {
      sort: { name: 1 },
    };

    if (limit) {
      options.limit = limit;
    }

    return this.findMany(query, options);
  }
}

