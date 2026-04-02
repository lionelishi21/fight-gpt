/**
 * AiService Integration Tests
 * Tests AI service with mocked repositories
 */

import { AiService } from '../../services/AiService';
import { IGameMetadataService } from '../../services/GameMetadataService';
import { ICharacterEncyclopediaService } from '../../services/CharacterEncyclopediaService';
import { AnalysisRequest, AnalysisResponse } from '../../types';
import { IGameMetadata, GameRule as CharacterGameRule } from '../../types/gameMetadata';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager, FileState } from '@google/generative-ai/server';

jest.mock('@google/generative-ai');
jest.mock('@google/generative-ai/server');

describe('AiService', () => {
  let aiService: AiService;
  let mockGameMetadataService: jest.Mocked<IGameMetadataService>;
  let mockCharacterEncyclopediaService: jest.Mocked<ICharacterEncyclopediaService>;
  const apiKey = 'mock_api_key';
  const modelName = 'gemini-1.5-flash';

  beforeEach(() => {
    mockGameMetadataService = {
      getCurrentGameMetadataByGameId: jest.fn(),
      getGameMetadataById: jest.fn(),
      getGameMetadataByGameId: jest.fn(),
      createGameMetadata: jest.fn(),
      updateGameMetadata: jest.fn(),
      updateGameMetadataByGameId: jest.fn(),
      deleteGameMetadata: jest.fn(),
    } as any;

    mockCharacterEncyclopediaService = {
      getGameRules: jest.fn(),
      getCurrentEncyclopediaByGameAndCharacter: jest.fn(),
      getEncyclopediaById: jest.fn(),
      getEncyclopediaByGameAndCharacter: jest.fn(),
      getEncyclopediasByGame: jest.fn(),
      createEncyclopedia: jest.fn(),
      updateEncyclopedia: jest.fn(),
      updateEncyclopediaByGameAndCharacter: jest.fn(),
      deleteEncyclopedia: jest.fn(),
    } as any;

    aiService = new AiService(
      apiKey,
      modelName,
      mockGameMetadataService,
      mockCharacterEncyclopediaService
    );

    jest.clearAllMocks();
  });

  describe('healthCheck', () => {
    it('should return true when AI service is healthy', async () => {


      const result = await aiService.healthCheck();

      expect(result).toBe(true);
    });

  });

  describe('getGameMetadata', () => {
    it('should fetch game metadata successfully', async () => {
      const mockGameMetadata: IGameMetadata = {
        _id: 'mock-id',
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
          has_air_dash: false,
        },
        patch_version: '1.05',
        is_current: true,
      };

      mockGameMetadataService.getCurrentGameMetadataByGameId.mockResolvedValue({
        success: true,
        data: mockGameMetadata,
      });

      const result = await aiService.getGameMetadata('sf6');

      expect(result).toEqual(mockGameMetadata);
      expect(mockGameMetadataService.getCurrentGameMetadataByGameId).toHaveBeenCalledWith('sf6');
    });

    it('should return null if game metadata not found', async () => {
      mockGameMetadataService.getCurrentGameMetadataByGameId.mockResolvedValue({
        success: false,
        error: 'Not found',
      });

      const result = await aiService.getGameMetadata('sf6');

      expect(result).toBeNull();
    });
  });

  describe('getCharacterGameRules', () => {
    it('should fetch character game rules successfully', async () => {
      const mockRules: CharacterGameRule[] = [
        {
          key: 'Drive Gauge',
          value: 6,
          ui_type: 'meter',
        },
      ];

      mockCharacterEncyclopediaService.getGameRules.mockResolvedValue({
        success: true,
        data: mockRules,
      });

      const result = await aiService.getCharacterGameRules('sf6', 'ryu');

      expect(result).toEqual(mockRules);
      expect(mockCharacterEncyclopediaService.getGameRules).toHaveBeenCalledWith('sf6', 'ryu');
    });

    it('should return null if character rules not found', async () => {
      mockCharacterEncyclopediaService.getGameRules.mockResolvedValue({
        success: false,
        error: 'Not found',
      });

      const result = await aiService.getCharacterGameRules('sf6', 'ryu');

      expect(result).toBeNull();
    });
  });

  describe('getGameConstants', () => {
    it('should extract constants from game metadata', async () => {
      const mockGameMetadata: IGameMetadata = {
        _id: 'mock-id',
        game_id: 'sf6',
        global_mechanics: [],
        constants: {
          team_size: 1,
          has_air_dash: false,
          max_meter: 6,
        },
        patch_version: '1.05',
        is_current: true,
      };

      mockGameMetadataService.getCurrentGameMetadataByGameId.mockResolvedValue({
        success: true,
        data: mockGameMetadata,
      });

      const result = await aiService.getGameConstants('sf6');

      expect(result).toEqual(mockGameMetadata.constants);
    });

    it('should return null if game metadata not found', async () => {
      mockGameMetadataService.getCurrentGameMetadataByGameId.mockResolvedValue({
        success: false,
        error: 'Not found',
      });

      const result = await aiService.getGameConstants('sf6');

      expect(result).toBeNull();
    });
  });

  describe('getGlobalMechanics', () => {
    it('should extract global mechanics from game metadata', async () => {
      const mockMechanics = [
        {
          key: 'Drive Gauge',
          value: 6,
          ui_type: 'meter',
        },
      ];

      const mockGameMetadata: IGameMetadata = {
        _id: 'mock-id',
        game_id: 'sf6',
        global_mechanics: mockMechanics,
        constants: {},
        patch_version: '1.05',
        is_current: true,
      };

      mockGameMetadataService.getCurrentGameMetadataByGameId.mockResolvedValue({
        success: true,
        data: mockGameMetadata,
      });

      const result = await aiService.getGlobalMechanics('sf6');

      expect(result).toEqual(mockMechanics);
    });
  });

  describe('analyzeVideo', () => {
    it('should send analysis request to AI service', async () => {
      const request: AnalysisRequest = {
        youtube_url: 'https://www.youtube.com/watch?v=test',
        video_path: 'test.mp4',
        game_id: 'sf6',
        p1_character_id: 'ryu',
        p2_character_id: 'ken',
      };

      const mockResponse: AnalysisResponse = {
        status: 'success',
        source: 'new_analysis',
        game_title: 'Street Fighter 6',
        p1_character: 'Ryu',
        p2_character: 'Ken',
        match_winner: 'p1',
        timeline: [],
        top_3_tips: [],
        daily_mission: {
          title: 'Test',
          drill_steps: [],
          goal: 'Test goal',
        },
      };

      // Mock the file manager upload response
      const mockUploadResponse = { file: { name: 'mock-file-name', uri: 'mock-uri', mimeType: 'video/mp4' } };
      const mockGetFileProcessing = { state: FileState.PROCESSING };
      const mockGetFileActive = { state: FileState.ACTIVE };

      const mockUploadFile = jest.fn().mockResolvedValue(mockUploadResponse);
      const mockGetFile = jest.fn()
        .mockResolvedValueOnce(mockGetFileProcessing)
        .mockResolvedValueOnce(mockGetFileActive);
      const mockDeleteFile = jest.fn().mockResolvedValue({});

      (GoogleAIFileManager as jest.Mock).mockImplementation(() => ({
        uploadFile: mockUploadFile,
        getFile: mockGetFile,
        deleteFile: mockDeleteFile,
      }));

      // Mock the generative AI model
      const mockGenerateContent = jest.fn().mockResolvedValue({
        response: {
          text: () => JSON.stringify(mockResponse)
        }
      });
      const mockGetGenerativeModel = jest.fn().mockReturnValue({
        generateContent: mockGenerateContent
      });
      (GoogleGenerativeAI as jest.Mock).mockImplementation(() => ({
        getGenerativeModel: mockGetGenerativeModel
      }));

      const service = new AiService(
        apiKey,
        modelName,
        mockGameMetadataService,
        mockCharacterEncyclopediaService
      );

      const result = await service.analyzeVideo(request);

      expect(result).toEqual(mockResponse);
      expect(mockUploadFile).toHaveBeenCalledWith('test.mp4', expect.any(Object));
      expect(mockGetGenerativeModel).toHaveBeenCalledWith({ model: modelName });
      expect(mockGenerateContent).toHaveBeenCalled();
      expect(mockDeleteFile).toHaveBeenCalledWith('mock-file-name');
    });

    it('should handle errors gracefully', async () => {
      const request: AnalysisRequest = {
        youtube_url: 'https://www.youtube.com/watch?v=test',
        video_path: 'test.mp4',
      };

      const mockUploadFile = jest.fn().mockRejectedValue(new Error('AI service error'));
      (GoogleAIFileManager as jest.Mock).mockImplementation(() => ({
        uploadFile: mockUploadFile,
      }));

      const service = new AiService(
        apiKey,
        modelName,
        mockGameMetadataService,
        mockCharacterEncyclopediaService
      );

      await expect(service.analyzeVideo(request)).rejects.toThrow();
    });
  });
});
