/**
 * GameMetadataRepository Unit Tests
 */

import { GameMetadataRepository } from '../../repositories/GameMetadataRepository';
import { GameMetadata, IGameMetadataDocument } from '../../models/GameMetadata';
import { CreateGameMetadataRequest, UpdateGameMetadataRequest } from '../../types/gameMetadata';
import mongoose from 'mongoose';

// Mock the GameMetadata model
jest.mock('../../models/GameMetadata');

describe('GameMetadataRepository', () => {
  let repository: GameMetadataRepository;
  let mockGameMetadata: jest.Mocked<IGameMetadataDocument>;

  beforeEach(() => {
    repository = new GameMetadataRepository();
    jest.clearAllMocks();

    // Create mock document
    mockGameMetadata = {
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
        has_3d_movement: false,
      },
      patch_version: '1.05',
      is_current: true,
      created_at: new Date(),
      updated_at: new Date(),
      save: jest.fn(),
    } as any;
  });

  describe('findByGameId', () => {
    it('should find game metadata by game_id', async () => {
      (GameMetadata.findOne as jest.Mock) = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockGameMetadata),
      });

      const result = await repository.findByGameId('sf6');

      expect(result).toBe(mockGameMetadata);
      expect(GameMetadata.findOne).toHaveBeenCalledWith({ game_id: 'sf6' });
    });

    it('should normalize game_id to lowercase', async () => {
      (GameMetadata.findOne as jest.Mock) = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockGameMetadata),
      });

      await repository.findByGameId('SF6');

      expect(GameMetadata.findOne).toHaveBeenCalledWith({ game_id: 'sf6' });
    });

    it('should return null if not found', async () => {
      (GameMetadata.findOne as jest.Mock) = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await repository.findByGameId('sf6');

      expect(result).toBeNull();
    });
  });

  describe('findCurrentByGameId', () => {
    it('should find current game metadata by game_id', async () => {
      (GameMetadata.findOne as jest.Mock) = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockGameMetadata),
      });

      const result = await repository.findCurrentByGameId('sf6');

      expect(result).toBe(mockGameMetadata);
      expect(GameMetadata.findOne).toHaveBeenCalledWith({
        game_id: 'sf6',
        is_current: true,
      });
    });
  });

  describe('findByGameIdAndVersion', () => {
    it('should find game metadata by game_id and version', async () => {
      (GameMetadata.findOne as jest.Mock) = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockGameMetadata),
      });

      const result = await repository.findByGameIdAndVersion('sf6', '1.05');

      expect(result).toBe(mockGameMetadata);
      expect(GameMetadata.findOne).toHaveBeenCalledWith({
        game_id: 'sf6',
        patch_version: '1.05',
      });
    });
  });

  describe('createGameMetadata', () => {
    it('should create new game metadata', async () => {
      const createData: CreateGameMetadataRequest = {
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

      const mockSave = jest.fn().mockResolvedValue(mockGameMetadata);
      (GameMetadata as any).mockImplementation(() => ({
        ...mockGameMetadata,
        save: mockSave,
      }));

      const result = await repository.createGameMetadata(createData);

      expect(result).toBeDefined();
      expect(result.game_id).toBe('sf6');
      expect(mockSave).toHaveBeenCalled();
    });

    it('should normalize game_id to lowercase', async () => {
      const createData: CreateGameMetadataRequest = {
        game_id: 'SF6',
        global_mechanics: [],
        constants: {},
      };

      const mockSave = jest.fn().mockResolvedValue({
        ...mockGameMetadata,
        game_id: 'sf6',
      });
      (GameMetadata as any).mockImplementation((data: any) => ({
        ...mockGameMetadata,
        game_id: data.game_id.toLowerCase(),
        save: mockSave,
      }));

      const result = await repository.createGameMetadata(createData);

      expect(result.game_id).toBe('sf6');
    });
  });

  describe('updateGameMetadata', () => {
    it('should update game metadata by ID', async () => {
      const updateData: UpdateGameMetadataRequest = {
        patch_version: '1.06',
      };

      const updatedDoc = { ...mockGameMetadata, patch_version: '1.06' };
      // Mock the base repository's update method
      jest.spyOn(repository as any, 'update').mockResolvedValue(updatedDoc);

      const result = await repository.updateGameMetadata('mock-id', updateData);

      expect(result).toBeDefined();
      expect(result?.patch_version).toBe('1.06');
    });
  });

  describe('updateGameMetadataByGameId', () => {
    it('should update game metadata by game_id', async () => {
      const updateData: UpdateGameMetadataRequest = {
        patch_version: '1.06',
      };

      const updatedDoc = { ...mockGameMetadata, patch_version: '1.06' };
      const mockExec = jest.fn().mockResolvedValue(updatedDoc);
      (GameMetadata.findOneAndUpdate as jest.Mock) = jest.fn().mockReturnValue({
        exec: mockExec,
      });

      const result = await repository.updateGameMetadataByGameId('sf6', updateData);

      expect(result).toBeDefined();
      expect(result?.patch_version).toBe('1.06');
      expect(GameMetadata.findOneAndUpdate).toHaveBeenCalledWith(
        { game_id: 'sf6' },
        updateData,
        { new: true }
      );
    });

    it('should return null if not found', async () => {
      const mockExec = jest.fn().mockResolvedValue(null);
      (GameMetadata.findOneAndUpdate as jest.Mock) = jest.fn().mockReturnValue({
        exec: mockExec,
      });

      const result = await repository.updateGameMetadataByGameId('sf6', {});

      expect(result).toBeNull();
    });
  });
});
