import {
  CreateGameMetadataRequest,
  UpdateGameMetadataRequest,
  IGameMetadata,
} from '../types/gameMetadata';
import { IGameMetadataRepository } from '../repositories/GameMetadataRepository';
import { IGameMetadataDocument } from '../models/GameMetadata';
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
  updateGameMetadataByGameId(
    gameId: string,
    request: UpdateGameMetadataRequest
  ): Promise<ApiResponse<IGameMetadata>>;
  deleteGameMetadata(id: string): Promise<ApiResponse<boolean>>;
}

/**
 * Game Metadata service implementation
 * Follows Single Responsibility Principle - orchestrates game metadata business logic
 * Follows Dependency Inversion Principle - depends on repository interface
 */
export class GameMetadataService extends BaseService implements IGameMetadataService {
  constructor(private readonly gameMetadataRepository: IGameMetadataRepository) {
    super();
  }

  /**
   * Create new game metadata
   */
  async createGameMetadata(request: CreateGameMetadataRequest): Promise<ApiResponse<IGameMetadata>> {
    try {
      this.validateCreateRequest(request);

      // Check if game_id already exists
      const existing = await this.gameMetadataRepository.findByGameId(request.game_id);
      if (existing) {
        return {
          success: false,
          error: `Game metadata with ID "${request.game_id}" already exists`,
        };
      }

      // Normalize game_id
      const normalizedRequest = {
        ...request,
        game_id: request.game_id.toLowerCase().trim(),
        is_current: request.is_current !== undefined ? request.is_current : true,
      };

      const gameMetadata = await this.gameMetadataRepository.createGameMetadata(normalizedRequest);

      return {
        success: true,
        data: this.mapToGameMetadata(gameMetadata),
        message: 'Game metadata created successfully',
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
   * Get game metadata by MongoDB ID
   */
  async getGameMetadataById(id: string): Promise<ApiResponse<IGameMetadata>> {
    try {
      const gameMetadata = await this.gameMetadataRepository.findById(id);

      if (!gameMetadata) {
        return {
          success: false,
          error: 'Game metadata not found',
        };
      }

      return {
        success: true,
        data: this.mapToGameMetadata(gameMetadata),
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
   * Get game metadata by game_id
   */
  async getGameMetadataByGameId(gameId: string): Promise<ApiResponse<IGameMetadata>> {
    try {
      const gameMetadata = await this.gameMetadataRepository.findByGameId(gameId);

      if (!gameMetadata) {
        return {
          success: false,
          error: 'Game metadata not found',
        };
      }

      return {
        success: true,
        data: this.mapToGameMetadata(gameMetadata),
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
   * Get current game metadata by game_id (for AI service)
   */
  async getCurrentGameMetadataByGameId(gameId: string): Promise<ApiResponse<IGameMetadata>> {
    try {
      const gameMetadata = await this.gameMetadataRepository.findCurrentByGameId(gameId);

      if (!gameMetadata) {
        return {
          success: false,
          error: 'Current game metadata not found',
        };
      }

      return {
        success: true,
        data: this.mapToGameMetadata(gameMetadata),
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
   * Update game metadata by MongoDB ID
   */
  async updateGameMetadata(
    id: string,
    request: UpdateGameMetadataRequest
  ): Promise<ApiResponse<IGameMetadata>> {
    try {
      const existing = await this.gameMetadataRepository.findById(id);

      if (!existing) {
        return {
          success: false,
          error: 'Game metadata not found',
        };
      }

      const updated = await this.gameMetadataRepository.updateGameMetadata(id, request);

      if (!updated) {
        return {
          success: false,
          error: 'Failed to update game metadata',
        };
      }

      return {
        success: true,
        data: this.mapToGameMetadata(updated),
        message: 'Game metadata updated successfully',
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
   * Update game metadata by game_id
   */
  async updateGameMetadataByGameId(
    gameId: string,
    request: UpdateGameMetadataRequest
  ): Promise<ApiResponse<IGameMetadata>> {
    try {
      const existing = await this.gameMetadataRepository.findByGameId(gameId);

      if (!existing) {
        return {
          success: false,
          error: 'Game metadata not found',
        };
      }

      const updated = await this.gameMetadataRepository.updateGameMetadataByGameId(gameId, request);

      if (!updated) {
        return {
          success: false,
          error: 'Failed to update game metadata',
        };
      }

      return {
        success: true,
        data: this.mapToGameMetadata(updated),
        message: 'Game metadata updated successfully',
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
   * Delete game metadata
   */
  async deleteGameMetadata(id: string): Promise<ApiResponse<boolean>> {
    try {
      const gameMetadata = await this.gameMetadataRepository.findById(id);

      if (!gameMetadata) {
        return {
          success: false,
          error: 'Game metadata not found',
        };
      }

      const deleted = await this.gameMetadataRepository.delete(id);

      return {
        success: deleted,
        data: deleted,
        message: deleted ? 'Game metadata deleted successfully' : 'Failed to delete game metadata',
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
   * Validate create request
   */
  private validateCreateRequest(request: CreateGameMetadataRequest): void {
    if (!request.game_id || request.game_id.trim().length === 0) {
      throw new Error('game_id is required');
    }

    if (!request.global_mechanics || !Array.isArray(request.global_mechanics)) {
      throw new Error('global_mechanics is required and must be an array');
    }

    if (!request.constants || typeof request.constants !== 'object') {
      throw new Error('constants is required and must be an object');
    }

    // Validate global_mechanics array
    for (const mechanic of request.global_mechanics) {
      if (!mechanic.key || mechanic.key.trim().length === 0) {
        throw new Error('global_mechanics[].key is required');
      }
      if (!mechanic.ui_type || mechanic.ui_type.trim().length === 0) {
        throw new Error('global_mechanics[].ui_type is required');
      }
      if (mechanic.value === undefined || mechanic.value === null) {
        throw new Error('global_mechanics[].value is required');
      }
    }
  }

  /**
   * Map document to game metadata interface
   */
  private mapToGameMetadata(document: IGameMetadataDocument): IGameMetadata {
    return {
      _id: document._id.toString(),
      game_id: document.game_id,
      global_mechanics: document.global_mechanics,
      constants: document.constants,
      patch_version: document.patch_version,
      is_current: document.is_current,
      created_at: document.created_at,
      updated_at: document.updated_at,
    };
  }
}
