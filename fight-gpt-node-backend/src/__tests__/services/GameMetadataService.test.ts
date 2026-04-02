/**
 * GameMetadataService Unit Tests
 */

import { GameMetadataService } from '../../services/GameMetadataService';
import { IGameMetadataRepository } from '../../repositories/GameMetadataRepository';
import { CreateGameMetadataRequest, UpdateGameMetadataRequest } from '../../types/gameMetadata';
import mongoose from 'mongoose';

describe('GameMetadataService', () => {
  let service: GameMetadataService;
  let mockRepository: jest.Mocked<IGameMetadataRepository>;
  let mockDocument: any;

  beforeEach(() => {
    mockRepository = {
      findByGameId: jest.fn(),
      findCurrentByGameId: jest.fn(),
      findByGameIdAndVersion: jest.fn(),
      findById: jest.fn(),
      createGameMetadata: jest.fn(),
      updateGameMetadata: jest.fn(),
      updateGameMetadataByGameId: jest.fn(),
      delete: jest.fn(),
    } as any;

    service = new GameMetadataService(mockRepository);

    mockDocument = {
      _id: new mongoose.Types.ObjectId(),
      game_id: 'sf6',
      global_mechanics: [
        {
          key: 'Drive Gauge',
          value: 6,
          ui_type: 'meter',
          description: 'System gauge',
        },
      ],
      constants: {
        team_size: 1,
        has_air_dash: false,
      },
      patch_version: '1.05',
      is_current: true,
      created_at: new Date(),
      updated_at: new Date(),
    };
  });

  describe('createGameMetadata', () => {
    it('should create game metadata successfully', async () => {
      const request: CreateGameMetadataRequest = {
        game_id: 'sf6',
        global_mechanics: [
          {
            key: 'Drive Gauge',
            value: 6,
            ui_type: 'meter',
          },
        ],
        constants: {
          team_size: 1,
        },
      };

      mockRepository.findByGameId.mockResolvedValue(null);
      mockRepository.createGameMetadata.mockResolvedValue(mockDocument);

      const result = await service.createGameMetadata(request);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.game_id).toBe('sf6');
    });

    it('should return error if game_id already exists', async () => {
      const request: CreateGameMetadataRequest = {
        game_id: 'sf6',
        global_mechanics: [],
        constants: {},
      };

      mockRepository.findByGameId.mockResolvedValue(mockDocument);

      const result = await service.createGameMetadata(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('already exists');
    });

    it('should validate required fields', async () => {
      const request = {
        game_id: '',
        global_mechanics: [],
        constants: {},
      } as CreateGameMetadataRequest;

      const result = await service.createGameMetadata(request);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('getGameMetadataByGameId', () => {
    it('should return game metadata by game_id', async () => {
      mockRepository.findByGameId.mockResolvedValue(mockDocument);

      const result = await service.getGameMetadataByGameId('sf6');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.game_id).toBe('sf6');
    });

    it('should return error if not found', async () => {
      mockRepository.findByGameId.mockResolvedValue(null);

      const result = await service.getGameMetadataByGameId('sf6');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Game metadata not found');
    });
  });

  describe('getCurrentGameMetadataByGameId', () => {
    it('should return current game metadata', async () => {
      mockRepository.findCurrentByGameId.mockResolvedValue(mockDocument);

      const result = await service.getCurrentGameMetadataByGameId('sf6');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should return error if not found', async () => {
      mockRepository.findCurrentByGameId.mockResolvedValue(null);

      const result = await service.getCurrentGameMetadataByGameId('sf6');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Current game metadata not found');
    });
  });

  describe('updateGameMetadataByGameId', () => {
    it('should update game metadata successfully', async () => {
      const updateData: UpdateGameMetadataRequest = {
        patch_version: '1.06',
      };

      mockRepository.findByGameId.mockResolvedValue(mockDocument);
      mockRepository.updateGameMetadataByGameId.mockResolvedValue({
        ...mockDocument,
        patch_version: '1.06',
      });

      const result = await service.updateGameMetadataByGameId('sf6', updateData);

      expect(result.success).toBe(true);
      expect(result.data?.patch_version).toBe('1.06');
    });

    it('should return error if not found', async () => {
      mockRepository.findByGameId.mockResolvedValue(null);

      const result = await service.updateGameMetadataByGameId('sf6', {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Game metadata not found');
    });
  });

  describe('deleteGameMetadata', () => {
    it('should delete game metadata successfully', async () => {
      // Mock the base repository methods
      (mockRepository as any).findById = jest.fn().mockResolvedValue(mockDocument);
      (mockRepository as any).delete = jest.fn().mockResolvedValue(true);

      const result = await service.deleteGameMetadata(mockDocument._id.toString());

      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
    });

    it('should return error if not found', async () => {
      (mockRepository as any).findById = jest.fn().mockResolvedValue(null);

      const result = await service.deleteGameMetadata('mock-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Game metadata not found');
    });
  });
});
