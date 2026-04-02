import { BaseRepository } from './BaseRepository';
import { CharacterEncyclopedia, ICharacterEncyclopediaDocument } from '../models/CharacterEncyclopedia';
import { CreateCharacterEncyclopediaRequest, UpdateCharacterEncyclopediaRequest } from '../types/characterEncyclopedia';

/**
 * Character Encyclopedia repository interface
 * Follows Interface Segregation Principle
 */
export interface ICharacterEncyclopediaRepository {
  findById(id: string): Promise<ICharacterEncyclopediaDocument | null>;
  findByGameIdAndCharacterId(gameId: string, characterId: string): Promise<ICharacterEncyclopediaDocument | null>;
  findCurrentByGameIdAndCharacterId(gameId: string, characterId: string): Promise<ICharacterEncyclopediaDocument | null>;
  findByGameIdAndCharacterIdAndVersion(
    gameId: string,
    characterId: string,
    version: string
  ): Promise<ICharacterEncyclopediaDocument | null>;
  findByGameId(gameId: string): Promise<ICharacterEncyclopediaDocument[]>;
  createEncyclopedia(data: CreateCharacterEncyclopediaRequest): Promise<ICharacterEncyclopediaDocument>;
  updateEncyclopedia(id: string, data: UpdateCharacterEncyclopediaRequest): Promise<ICharacterEncyclopediaDocument | null>;
  updateEncyclopediaByGameAndCharacter(
    gameId: string,
    characterId: string,
    data: UpdateCharacterEncyclopediaRequest
  ): Promise<ICharacterEncyclopediaDocument | null>;
  delete(id: string): Promise<boolean>;
}

/**
 * Character Encyclopedia repository implementation
 * Follows Single Responsibility Principle - handles only character encyclopedia data operations
 * Follows Dependency Inversion Principle - depends on BaseRepository abstraction
 */
export class CharacterEncyclopediaRepository
  extends BaseRepository<ICharacterEncyclopediaDocument>
  implements ICharacterEncyclopediaRepository
{
  constructor() {
    super(CharacterEncyclopedia);
  }

  /**
   * Find character encyclopedia by game_id and character_id
   */
  async findByGameIdAndCharacterId(
    gameId: string,
    characterId: string
  ): Promise<ICharacterEncyclopediaDocument | null> {
    try {
      const normalizedGameId = gameId.toLowerCase().trim();
      const normalizedCharacterId = characterId.toLowerCase().trim();
      return await this.findOne({
        game_id: normalizedGameId,
        character_id: normalizedCharacterId,
      });
    } catch (error) {
      throw this.handleError(error, 'findByGameIdAndCharacterId');
    }
  }

  /**
   * Find current character encyclopedia by game_id and character_id
   * Returns encyclopedia where is_current_patch is true
   */
  async findCurrentByGameIdAndCharacterId(
    gameId: string,
    characterId: string
  ): Promise<ICharacterEncyclopediaDocument | null> {
    try {
      const normalizedGameId = gameId.toLowerCase().trim();
      const normalizedCharacterId = characterId.toLowerCase().trim();
      return await this.findOne({
        game_id: normalizedGameId,
        character_id: normalizedCharacterId,
        is_current_patch: true,
      });
    } catch (error) {
      throw this.handleError(error, 'findCurrentByGameIdAndCharacterId');
    }
  }

  /**
   * Find character encyclopedia by game_id, character_id, and patch_version
   */
  async findByGameIdAndCharacterIdAndVersion(
    gameId: string,
    characterId: string,
    version: string
  ): Promise<ICharacterEncyclopediaDocument | null> {
    try {
      const normalizedGameId = gameId.toLowerCase().trim();
      const normalizedCharacterId = characterId.toLowerCase().trim();
      return await this.findOne({
        game_id: normalizedGameId,
        character_id: normalizedCharacterId,
        patch_version: version.trim(),
      });
    } catch (error) {
      throw this.handleError(error, 'findByGameIdAndCharacterIdAndVersion');
    }
  }

  /**
   * Find all character encyclopedias by game_id
   */
  async findByGameId(gameId: string): Promise<ICharacterEncyclopediaDocument[]> {
    try {
      const normalizedGameId = gameId.toLowerCase().trim();
      return await this.findMany({ game_id: normalizedGameId }, { sort: { character_id: 1, patch_version: -1 } });
    } catch (error) {
      throw this.handleError(error, 'findByGameId');
    }
  }

  /**
   * Create new character encyclopedia
   */
  async createEncyclopedia(data: CreateCharacterEncyclopediaRequest): Promise<ICharacterEncyclopediaDocument> {
    try {
      // Normalize game_id and character_id to lowercase
      const normalizedData = {
        ...data,
        game_id: data.game_id.toLowerCase().trim(),
        character_id: data.character_id.toLowerCase().trim(),
        is_current_patch: data.is_current_patch !== undefined ? data.is_current_patch : true,
      };

      return await this.create(normalizedData as Partial<ICharacterEncyclopediaDocument>);
    } catch (error) {
      throw this.handleError(error, 'createEncyclopedia');
    }
  }

  /**
   * Update character encyclopedia by MongoDB ID
   */
  async updateEncyclopedia(
    id: string,
    data: UpdateCharacterEncyclopediaRequest
  ): Promise<ICharacterEncyclopediaDocument | null> {
    try {
      // Normalize game_id and character_id if provided
      const updateData = { ...data };
      if (updateData.game_id) {
        updateData.game_id = updateData.game_id.toLowerCase().trim();
      }
      if (updateData.character_id) {
        updateData.character_id = updateData.character_id.toLowerCase().trim();
      }

      return await this.update(id, updateData);
    } catch (error) {
      throw this.handleError(error, 'updateEncyclopedia');
    }
  }

  /**
   * Update character encyclopedia by game_id and character_id
   */
  async updateEncyclopediaByGameAndCharacter(
    gameId: string,
    characterId: string,
    data: UpdateCharacterEncyclopediaRequest
  ): Promise<ICharacterEncyclopediaDocument | null> {
    try {
      const normalizedGameId = gameId.toLowerCase().trim();
      const normalizedCharacterId = characterId.toLowerCase().trim();

      // Normalize game_id and character_id if provided in update data
      const updateData = { ...data };
      if (updateData.game_id) {
        updateData.game_id = updateData.game_id.toLowerCase().trim();
      }
      if (updateData.character_id) {
        updateData.character_id = updateData.character_id.toLowerCase().trim();
      }

      // Use findOneAndUpdate to update by game_id and character_id
      return await this.model
        .findOneAndUpdate(
          { game_id: normalizedGameId, character_id: normalizedCharacterId },
          updateData,
          { new: true }
        )
        .exec();
    } catch (error) {
      throw this.handleError(error, 'updateEncyclopediaByGameAndCharacter');
    }
  }
}
