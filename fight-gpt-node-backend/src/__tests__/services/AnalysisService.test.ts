/**
 * AnalysisService Ingestion & Reprocess Unit Tests
 */

import { AnalysisService } from '../../services/AnalysisService';
import { IAnalysisRepository } from '../../repositories/AnalysisRepository';
import { IAiService } from '../../services/AiService';
import { IGameMetadataService } from '../../services/GameMetadataService';
import { ICharacterEncyclopediaService } from '../../services/CharacterEncyclopediaService';

describe('AnalysisService - Ingestion and Reprocess Enhancements', () => {
  let service: AnalysisService;
  let mockAnalysisRepository: jest.Mocked<IAnalysisRepository>;
  let mockAiService: jest.Mocked<IAiService>;
  let mockGameMetadataService: jest.Mocked<IGameMetadataService>;
  let mockCharacterEncyclopediaService: jest.Mocked<ICharacterEncyclopediaService>;

  beforeEach(() => {
    mockAnalysisRepository = {
      createAnalysis: jest.fn(),
      findByYouTubeUrl: jest.fn(),
      findByVideoPath: jest.fn(),
      findByAnalysisId: jest.fn(),
      getRecentAnalyses: jest.fn(),
      countRecentAnalysesByUser: jest.fn(),
      getDiscoveryAnalyses: jest.fn(),
      incrementViewCount: jest.fn(),
      incrementClickCount: jest.fn(),
    } as any;

    mockAiService = {
      analyzeVideo: jest.fn(),
      generateEmbedding: jest.fn(),
    } as any;

    mockGameMetadataService = {
      getCurrentGameMetadataByGameId: jest.fn().mockResolvedValue({
        success: true,
        data: {
          game_id: 'sf6',
          name: 'Street Fighter 6',
          latest_version: '1.05',
          global_mechanics: [],
          constants: {},
        },
      }),
    } as any;

    mockCharacterEncyclopediaService = {
      getEncyclopediasByGame: jest.fn().mockResolvedValue({
        success: true,
        data: [
          { character_id: 'ryu' },
          { character_id: 'ken' },
          { character_id: 'chunli' },
          { character_id: 'akuma' },
          { character_id: 'bison' },
          { character_id: 'ed' },
        ],
      }),
      getGameRules: jest.fn().mockResolvedValue({ success: true, data: [] }),
      getCurrentEncyclopediaByGameAndCharacter: jest.fn().mockResolvedValue({ success: true, data: null }),
    } as any;

    service = new AnalysisService(
      mockAnalysisRepository,
      mockAiService,
      mockGameMetadataService,
      mockCharacterEncyclopediaService
    );
  });

  describe('enrichRequestWithGameContext - Title Parsing', () => {
    it('should parse player names and characters from "Player (Char) vs Player (Char)"', async () => {
      const request = {
        game_id: 'sf6',
        video_title: 'Puodo (Ed) vs Shuto (Akuma)',
      };

      const result = await (service as any).enrichRequestWithGameContext(request);

      expect(result.p1_name).toBe('Puodo');
      expect(result.p1_character_id).toBe('ed');
      expect(result.p2_name).toBe('Shuto');
      expect(result.p2_character_id).toBe('akuma');
    });

    it('should parse characters when there are no player names, e.g. "Chun-Li vs Ryu"', async () => {
      const request = {
        game_id: 'sf6',
        video_title: 'Chun-Li vs Ryu Match',
      };

      const result = await (service as any).enrichRequestWithGameContext(request);

      expect(result.p1_character_id).toBe('chunli');
      expect(result.p2_character_id).toBe('ryu');
      expect(result.p1_name).toBeUndefined();
      expect(result.p2_name).toBeUndefined();
    });

    it('should handle bracket formatting "MenaRD [Bison] vs Lexx [Guile]"', async () => {
      mockCharacterEncyclopediaService.getEncyclopediasByGame.mockResolvedValue({
        success: true,
        data: [
          { character_id: 'bison' },
          { character_id: 'guile' },
        ],
      } as any);

      const request = {
        game_id: 'sf6',
        video_title: 'MenaRD [Bison] vs Lexx [Guile]',
      };

      const result = await (service as any).enrichRequestWithGameContext(request);

      expect(result.p1_name).toBe('MenaRD');
      expect(result.p1_character_id).toBe('bison');
      expect(result.p2_name).toBe('Lexx');
      expect(result.p2_character_id).toBe('guile');
    });

    it('should fallback to scanning the entire title for character IDs if standard split fails', async () => {
      const request = {
        game_id: 'sf6',
        video_title: 'Unbelievable SF6 Ryu and Ken Highlights',
      };

      const result = await (service as any).enrichRequestWithGameContext(request);

      expect(result.p1_character_id).toBe('ryu');
      expect(result.p2_character_id).toBe('ken');
    });

    it('should respect overrides and not overwrite them with title parsing', async () => {
      const request = {
        game_id: 'sf6',
        video_title: 'Puodo (Ed) vs Shuto (Akuma)',
        p1_character_id: 'ryu',
        p2_name: 'OverriddenPlayer',
      };

      const result = await (service as any).enrichRequestWithGameContext(request);

      expect(result.p1_character_id).toBe('ryu'); // override respected
      expect(result.p1_name).toBe('Puodo'); // parsed since missing
      expect(result.p2_name).toBe('OverriddenPlayer'); // override respected
      expect(result.p2_character_id).toBe('akuma'); // parsed since missing
    });
  });
});
