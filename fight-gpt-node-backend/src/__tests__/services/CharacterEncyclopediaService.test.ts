/**
 * CharacterEncyclopediaService Unit Tests
 */

import { CharacterEncyclopediaService } from '../../services/CharacterEncyclopediaService';
import { ICharacterEncyclopediaRepository } from '../../repositories/CharacterEncyclopediaRepository';
import {
  CreateCharacterEncyclopediaRequest,
  UpdateCharacterEncyclopediaRequest,
} from '../../types/characterEncyclopedia';
import mongoose from 'mongoose';

describe('CharacterEncyclopediaService', () => {
  let service: CharacterEncyclopediaService;
  let mockRepository: jest.Mocked<ICharacterEncyclopediaRepository>;
  let mockDocument: any;

  beforeEach(() => {
    mockRepository = {
      findByGameIdAndCharacterId: jest.fn(),
      findCurrentByGameIdAndCharacterId: jest.fn(),
      findByGameIdAndCharacterIdAndVersion: jest.fn(),
      findByGameId: jest.fn(),
      findById: jest.fn(),
      createEncyclopedia: jest.fn(),
      updateEncyclopedia: jest.fn(),
      updateEncyclopediaByGameAndCharacter: jest.fn(),
      delete: jest.fn(),
    } as any;

    service = new CharacterEncyclopediaService(mockRepository);

    mockDocument = {
      _id: new mongoose.Types.ObjectId(),
      game_id: 'sf6',
      character_id: 'ryu',
      patch_version: '1.05',
      is_current_patch: true,
      moveset: {
        normals: [],
        specials: [],
        ex_moves: [],
        supers: [],
      },
      game_rules: [],
      last_updated: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    };
  });

  describe('createEncyclopedia', () => {
    it('should create encyclopedia successfully', async () => {
      const request: CreateCharacterEncyclopediaRequest = {
        game_id: 'sf6',
        character_id: 'ryu',
        patch_version: '1.05',
        moveset: {
          normals: [],
          specials: [],
          ex_moves: [],
          supers: [],
        },
        game_rules: [],
      };

      mockRepository.findByGameIdAndCharacterIdAndVersion.mockResolvedValue(null);
      mockRepository.createEncyclopedia.mockResolvedValue(mockDocument);

      const result = await service.createEncyclopedia(request);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.game_id).toBe('sf6');
      expect(result.data?.character_id).toBe('ryu');
    });

    it('should return error if encyclopedia already exists', async () => {
      const request: CreateCharacterEncyclopediaRequest = {
        game_id: 'sf6',
        character_id: 'ryu',
        patch_version: '1.05',
        moveset: {
          normals: [],
          specials: [],
          ex_moves: [],
          supers: [],
        },
        game_rules: [],
      };

      mockRepository.findByGameIdAndCharacterIdAndVersion.mockResolvedValue(mockDocument);

      const result = await service.createEncyclopedia(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('already exists');
    });

    it('should validate required fields', async () => {
      const request = {
        game_id: '',
        character_id: 'ryu',
        patch_version: '1.05',
        moveset: {
          normals: [],
          specials: [],
          ex_moves: [],
          supers: [],
        },
        game_rules: [],
      } as CreateCharacterEncyclopediaRequest;

      const result = await service.createEncyclopedia(request);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('getCurrentEncyclopediaByGameAndCharacter', () => {
    it('should return current encyclopedia', async () => {
      mockRepository.findCurrentByGameIdAndCharacterId.mockResolvedValue(mockDocument);

      const result = await service.getCurrentEncyclopediaByGameAndCharacter('sf6', 'ryu');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.game_id).toBe('sf6');
      expect(result.data?.character_id).toBe('ryu');
    });

    it('should return error if not found', async () => {
      mockRepository.findCurrentByGameIdAndCharacterId.mockResolvedValue(null);

      const result = await service.getCurrentEncyclopediaByGameAndCharacter('sf6', 'ryu');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Current character encyclopedia not found');
    });
  });

  describe('getGameRules', () => {
    it('should return game rules for character', async () => {
      const mockRules = [
        {
          key: 'Drive Gauge',
          value: 6,
          ui_type: 'meter',
        },
      ];

      mockRepository.findCurrentByGameIdAndCharacterId.mockResolvedValue({
        ...mockDocument,
        game_rules: mockRules,
      });

      const result = await service.getGameRules('sf6', 'ryu');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockRules);
    });

    it('should return empty array if no rules', async () => {
      mockRepository.findCurrentByGameIdAndCharacterId.mockResolvedValue({
        ...mockDocument,
        game_rules: [],
      });

      const result = await service.getGameRules('sf6', 'ryu');

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });
  });

  describe('updateEncyclopediaByGameAndCharacter', () => {
    it('should update encyclopedia successfully', async () => {
      const updateData: UpdateCharacterEncyclopediaRequest = {
        patch_version: '1.06',
      };

      mockRepository.findByGameIdAndCharacterId.mockResolvedValue(mockDocument);
      mockRepository.updateEncyclopediaByGameAndCharacter.mockResolvedValue({
        ...mockDocument,
        patch_version: '1.06',
      });

      const result = await service.updateEncyclopediaByGameAndCharacter('sf6', 'ryu', updateData);

      expect(result.success).toBe(true);
      expect(result.data?.patch_version).toBe('1.06');
    });
  });
});
