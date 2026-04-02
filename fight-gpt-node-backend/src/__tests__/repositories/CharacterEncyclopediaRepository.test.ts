/**
 * CharacterEncyclopediaRepository Unit Tests
 */

import { CharacterEncyclopediaRepository } from '../../repositories/CharacterEncyclopediaRepository';
import { CharacterEncyclopedia, ICharacterEncyclopediaDocument } from '../../models/CharacterEncyclopedia';
import { CreateCharacterEncyclopediaRequest, UpdateCharacterEncyclopediaRequest } from '../../types/characterEncyclopedia';
import mongoose from 'mongoose';

// Mock the CharacterEncyclopedia model
jest.mock('../../models/CharacterEncyclopedia');

describe('CharacterEncyclopediaRepository', () => {
  let repository: CharacterEncyclopediaRepository;
  let mockDocument: jest.Mocked<ICharacterEncyclopediaDocument>;

  beforeEach(() => {
    repository = new CharacterEncyclopediaRepository();
    jest.clearAllMocks();

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
      save: jest.fn(),
    } as any;
  });

  describe('findByGameIdAndCharacterId', () => {
    it('should find encyclopedia by game_id and character_id', async () => {
      (CharacterEncyclopedia.findOne as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(mockDocument) });

      const result = await repository.findByGameIdAndCharacterId('sf6', 'ryu');

      expect(result).toBe(mockDocument);
      expect(CharacterEncyclopedia.findOne).toHaveBeenCalledWith({
        game_id: 'sf6',
        character_id: 'ryu',
      });
    });

    it('should normalize game_id and character_id to lowercase', async () => {
      (CharacterEncyclopedia.findOne as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(mockDocument) });

      await repository.findByGameIdAndCharacterId('SF6', 'RYU');

      expect(CharacterEncyclopedia.findOne).toHaveBeenCalledWith({
        game_id: 'sf6',
        character_id: 'ryu',
      });
    });
  });

  describe('findCurrentByGameIdAndCharacterId', () => {
    it('should find current encyclopedia by game_id and character_id', async () => {
      (CharacterEncyclopedia.findOne as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(mockDocument) });

      const result = await repository.findCurrentByGameIdAndCharacterId('sf6', 'ryu');

      expect(result).toBe(mockDocument);
      expect(CharacterEncyclopedia.findOne).toHaveBeenCalledWith({
        game_id: 'sf6',
        character_id: 'ryu',
        is_current_patch: true,
      });
    });
  });

  describe('findByGameIdAndCharacterIdAndVersion', () => {
    it('should find encyclopedia by game_id, character_id, and version', async () => {
      (CharacterEncyclopedia.findOne as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(mockDocument) });

      const result = await repository.findByGameIdAndCharacterIdAndVersion('sf6', 'ryu', '1.05');

      expect(result).toBe(mockDocument);
      expect(CharacterEncyclopedia.findOne).toHaveBeenCalledWith({
        game_id: 'sf6',
        character_id: 'ryu',
        patch_version: '1.05',
      });
    });
  });

  describe('findByGameId', () => {
    it('should find all encyclopedias for a game', async () => {
      const mockQuery: any = { exec: jest.fn().mockResolvedValue([mockDocument]) };
      mockQuery.sort = jest.fn().mockReturnValue(mockQuery);
      (CharacterEncyclopedia.find as jest.Mock).mockReturnValue(mockQuery);

      const result = await repository.findByGameId('sf6');
      expect(result).toEqual([mockDocument]);
      expect(CharacterEncyclopedia.find).toHaveBeenCalledWith({ game_id: 'sf6' });
      expect(mockQuery.sort).toHaveBeenCalledWith({ character_id: 1, patch_version: -1 });
    });
  });

  describe('createEncyclopedia', () => {
    it('should create new encyclopedia', async () => {
      const createData: CreateCharacterEncyclopediaRequest = {
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

      const mockSave = jest.fn().mockResolvedValue(mockDocument);
      (CharacterEncyclopedia as any).mockImplementation(() => ({
        ...mockDocument,
        save: mockSave,
      }));

      const result = await repository.createEncyclopedia(createData);

      expect(result).toBeDefined();
      expect(result.game_id).toBe('sf6');
      expect(result.character_id).toBe('ryu');
      expect(mockSave).toHaveBeenCalled();
    });

    it('should normalize game_id and character_id to lowercase', async () => {
      const createData: CreateCharacterEncyclopediaRequest = {
        game_id: 'SF6',
        character_id: 'RYU',
        patch_version: '1.05',
        moveset: {
          normals: [],
          specials: [],
          ex_moves: [],
          supers: [],
        },
        game_rules: [],
      };

      const mockSave = jest.fn().mockResolvedValue({
        ...mockDocument,
        game_id: 'sf6',
        character_id: 'ryu',
      });
      (CharacterEncyclopedia as any).mockImplementation((data: any) => ({
        ...mockDocument,
        game_id: data.game_id.toLowerCase(),
        character_id: data.character_id.toLowerCase(),
        save: mockSave,
      }));

      const result = await repository.createEncyclopedia(createData);

      expect(result.game_id).toBe('sf6');
      expect(result.character_id).toBe('ryu');
    });
  });

  describe('updateEncyclopediaByGameAndCharacter', () => {
    it('should update encyclopedia by game_id and character_id', async () => {
      const updateData: UpdateCharacterEncyclopediaRequest = {
        patch_version: '1.06',
      };

      const updatedDoc = { ...mockDocument, patch_version: '1.06' };
      const mockExec = jest.fn().mockResolvedValue(updatedDoc);
      (CharacterEncyclopedia.findOneAndUpdate as jest.Mock) = jest.fn().mockReturnValue({
        exec: mockExec,
      });

      const result = await repository.updateEncyclopediaByGameAndCharacter('sf6', 'ryu', updateData);

      expect(result).toBeDefined();
      expect(result?.patch_version).toBe('1.06');
      expect(CharacterEncyclopedia.findOneAndUpdate).toHaveBeenCalledWith(
        { game_id: 'sf6', character_id: 'ryu' },
        updateData,
        { new: true }
      );
    });
  });
});
