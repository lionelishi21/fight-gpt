import {
  CreateCharacterRequest,
  UpdateCharacterRequest,
  CharacterFilters,
  ICharacter,
} from '../types/character';
import { ICharacterRepository } from '../repositories/CharacterRepository';
import { ICharacterDocument } from '../models/Character';
import { ApiResponse, PaginatedResponse } from '../types';
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
export class CharacterService extends BaseService implements ICharacterService {
  constructor(
    private readonly characterRepository: ICharacterRepository,
    private readonly gameRepository?: IGameRepository // Optional to avoid breaking existing code
  ) {
    super();
  }

  /**
   * Create new character
   */
  async createCharacter(request: CreateCharacterRequest): Promise<ApiResponse<ICharacter>> {
    try {
      this.validateCreateRequest(request);

      // Check if character with same game_id, name, and version already exists
      const existing = await this.characterRepository.findWithFilters({
        game_id: request.game_id,
        name: request.name,
        version: request.version,
      });

      if (existing.length > 0) {
        return {
          success: false,
          error: `Character ${request.name} version ${request.version} already exists for game ${request.game_id}`,
        };
      }

      // If setting as current, unset other current characters for same game and name
      if (request.is_current) {
        await this.unsetCurrentCharacters(request.game_id, request.name);
      }

      const character = await this.characterRepository.createCharacter(request);

      // Update game character count if game repository is available
      // Count current characters for the game and update the count
      if (this.gameRepository) {
        const currentCharacters = await this.characterRepository.findCurrentCharactersByGame(
          character.game_id
        );
        const count = currentCharacters.length;
        await this.gameRepository
          .refreshCharacterCount(character.game_id, count)
          .catch((err) => {
            console.error('[CharacterService] Failed to refresh game character count:', err);
          });
      }

      return {
        success: true,
        data: this.mapToCharacter(character),
        message: 'Character created successfully',
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Get character by ID
   */
  async getCharacterById(id: string): Promise<ApiResponse<ICharacter>> {
    try {
      const character = await this.characterRepository.findById(id);

      if (!character) {
        return {
          success: false,
          error: 'Character not found',
        };
      }

      return {
        success: true,
        data: this.mapToCharacter(character),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Update character
   */
  async updateCharacter(
    id: string,
    request: UpdateCharacterRequest
  ): Promise<ApiResponse<ICharacter>> {
    try {
      const existing = await this.characterRepository.findById(id);

      if (!existing) {
        return {
          success: false,
          error: 'Character not found',
        };
      }

      // If setting as current, unset other current characters
      if (request.is_current === true) {
        const gameId = request.game_id || existing.game_id;
        const name = request.name || existing.name;
        await this.unsetCurrentCharacters(gameId, name, id);
      }

      const updated = await this.characterRepository.updateCharacter(id, request);

      if (!updated) {
        return {
          success: false,
          error: 'Failed to update character',
        };
      }

      return {
        success: true,
        data: this.mapToCharacter(updated),
        message: 'Character updated successfully',
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Delete character
   */
  async deleteCharacter(id: string): Promise<ApiResponse<boolean>> {
    try {
      const exists = await this.characterRepository.exists({ _id: id });

      if (!exists) {
        return {
          success: false,
          error: 'Character not found',
        };
      }

      // Get character before deletion to update game count
      const characterToDelete = await this.characterRepository.findById(id);

      if (!characterToDelete) {
        return {
          success: false,
          error: 'Character not found',
        };
      }

      const gameId = characterToDelete.game_id;

      const deleted = await this.characterRepository.delete(id);

      // Update game character count if game repository is available
      if (deleted && this.gameRepository && gameId) {
        // Re-count current characters for the game after deletion
        const currentCharacters = await this.characterRepository.findCurrentCharactersByGame(gameId);
        const count = currentCharacters.length;
        await this.gameRepository
          .refreshCharacterCount(gameId, count)
          .catch((err) => {
            console.error('[CharacterService] Failed to refresh game character count:', err);
          });
      }

      return {
        success: deleted,
        data: deleted,
        message: deleted ? 'Character deleted successfully' : 'Failed to delete character',
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Get all characters by game ID
   */
  async getCharactersByGame(gameId: string): Promise<ApiResponse<ICharacter[]>> {
    try {
      const characters = await this.characterRepository.findByGameId(gameId);

      return {
        success: true,
        data: characters.map((char) => this.mapToCharacter(char)),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Get current characters by game
   */
  async getCurrentCharactersByGame(gameId: string): Promise<ApiResponse<ICharacter[]>> {
    try {
      const characters = await this.characterRepository.findCurrentCharactersByGame(gameId);

      return {
        success: true,
        data: characters.map((char) => this.mapToCharacter(char)),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Get characters by game ID and name
   */
  async getCharactersByGameAndName(
    gameId: string,
    name: string
  ): Promise<ApiResponse<ICharacter[]>> {
    try {
      const characters = await this.characterRepository.findByGameIdAndName(gameId, name);

      return {
        success: true,
        data: characters.map((char) => this.mapToCharacter(char)),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Get characters by game ID and version
   */
  async getCharactersByGameAndVersion(
    gameId: string,
    version: string
  ): Promise<ApiResponse<ICharacter[]>> {
    try {
      const characters = await this.characterRepository.findByGameIdAndVersion(gameId, version);

      return {
        success: true,
        data: characters.map((char) => this.mapToCharacter(char)),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Get current character by game and name
   */
  async getCurrentCharacterByGameAndName(
    gameId: string,
    name: string
  ): Promise<ApiResponse<ICharacter>> {
    try {
      const character = await this.characterRepository.findCurrentCharacterByGameAndName(
        gameId,
        name
      );

      if (!character) {
        return {
          success: false,
          error: 'Character not found',
        };
      }

      return {
        success: true,
        data: this.mapToCharacter(character),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Search characters
   */
  async searchCharacters(query: string, gameId?: string): Promise<ApiResponse<ICharacter[]>> {
    try {
      if (!query || query.trim().length === 0) {
        return {
          success: false,
          error: 'Search query is required',
        };
      }

      const characters = await this.characterRepository.searchCharacters(query, gameId);

      return {
        success: true,
        data: characters.map((char) => this.mapToCharacter(char)),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Find characters with filters
   */
  async findCharacters(
    filters: CharacterFilters,
    limit?: number
  ): Promise<ApiResponse<ICharacter[]>> {
    try {
      const characters = await this.characterRepository.findWithFilters(filters, limit);

      return {
        success: true,
        data: characters.map((char) => this.mapToCharacter(char)),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Set character as current/not current
   */
  async setCharacterAsCurrent(
    id: string,
    isCurrent: boolean
  ): Promise<ApiResponse<ICharacter>> {
    try {
      const character = await this.characterRepository.findById(id);

      if (!character) {
        return {
          success: false,
          error: 'Character not found',
        };
      }

      // If setting as current, unset other current characters
      if (isCurrent) {
        await this.unsetCurrentCharacters(character.game_id, character.name, id);
      }

      const updated = await this.characterRepository.updateCharacter(id, {
        is_current: isCurrent,
      });

      if (!updated) {
        return {
          success: false,
          error: 'Failed to update character',
        };
      }

      return {
        success: true,
        data: this.mapToCharacter(updated),
        message: `Character ${isCurrent ? 'set as' : 'unset from'} current successfully`,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Unset current flag for all characters except the specified one
   */
  private async unsetCurrentCharacters(
    gameId: string,
    name: string,
    excludeId?: string
  ): Promise<void> {
    const filters: CharacterFilters = {
      game_id: gameId,
      name: name,
      is_current: true,
    };

    const currentCharacters = await this.characterRepository.findWithFilters(filters);

    for (const char of currentCharacters) {
      if (excludeId && char._id.toString() === excludeId) {
        continue;
      }
      await this.characterRepository.updateCharacter(char._id.toString(), { is_current: false });
    }
  }

  /**
   * Validate create request
   */
  private validateCreateRequest(request: CreateCharacterRequest): void {
    if (!request.game_id || request.game_id.trim().length === 0) {
      throw new Error('game_id is required');
    }
    if (!request.name || request.name.trim().length === 0) {
      throw new Error('name is required');
    }
    if (!request.version || request.version.trim().length === 0) {
      throw new Error('version is required');
    }
    if (!request.stats) {
      throw new Error('stats is required');
    }
    if (!Array.isArray(request.moves)) {
      throw new Error('moves must be an array');
    }
  }

  /**
   * Map document to character interface
   */
  private mapToCharacter(document: ICharacterDocument): ICharacter {
    return {
      _id: document._id.toString(),
      game_id: document.game_id,
      name: document.name,
      version: document.version,
      is_current: document.is_current,
      archetype: document.archetype,
      difficulty: document.difficulty,
      description: document.description,
      stats: document.stats,
      moves: document.moves,
      patch_notes_summary: document.patch_notes_summary,
      created_at: document.created_at,
      updated_at: document.updated_at,
    };
  }
}

