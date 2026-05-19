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
  countByGameId(gameId: string): Promise<number>;
  createEncyclopedia(data: CreateCharacterEncyclopediaRequest): Promise<ICharacterEncyclopediaDocument>;
  updateEncyclopedia(id: string, data: UpdateCharacterEncyclopediaRequest): Promise<ICharacterEncyclopediaDocument | null>;
  updateEncyclopediaByGameAndCharacter(
    gameId: string,
    characterId: string,
    data: UpdateCharacterEncyclopediaRequest
  ): Promise<ICharacterEncyclopediaDocument | null>;
  bumpPatchVersion(gameId: string, characterId: string, newPatchVersion: string): Promise<ICharacterEncyclopediaDocument>;
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

  async countByGameId(gameId: string): Promise<number> {
    try {
      return await this.model.countDocuments({ game_id: gameId.toLowerCase().trim() });
    } catch {
      return 0;
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

  /**
   * Create a new patch version for a character encyclopedia.
   * Marks all existing docs for this game+character as is_current_patch: false,
   * then creates a new doc with the new patch version copying the current moveset/rules/videos.
   */
  async bumpPatchVersion(gameId: string, characterId: string, newPatchVersion: string): Promise<ICharacterEncyclopediaDocument> {
    try {
      const normalizedGameId = gameId.toLowerCase().trim();
      const normalizedCharId = characterId.toLowerCase().trim();

      // Get current data to carry forward as baseline for new patch
      const current = await this.model.findOne({
        game_id: normalizedGameId,
        character_id: normalizedCharId,
        is_current_patch: true,
      }).lean().exec();

      // Mark all existing docs as not current
      await this.model.updateMany(
        { game_id: normalizedGameId, character_id: normalizedCharId },
        { $set: { is_current_patch: false } }
      ).exec();

      // Create new doc for the new patch, carrying moveset/rules/videos from current
      const newDoc = await this.create({
        game_id: normalizedGameId,
        character_id: normalizedCharId,
        patch_version: newPatchVersion,
        is_current_patch: true,
        moveset: (current as any)?.moveset ?? { normals: [], specials: [], ex_moves: [], supers: [] },
        game_rules: (current as any)?.game_rules ?? [],
        videos: (current as any)?.videos ?? [],
        version: (current as any)?.version ?? '1.0',
      } as any);

      return newDoc;
    } catch (error) {
      throw this.handleError(error, 'bumpPatchVersion');
    }
  }
}
