/**
 * CharacterEncyclopediaController Unit Tests
 */

import { Request, Response, NextFunction } from 'express';
import { CharacterEncyclopediaController } from '../../controllers/CharacterEncyclopediaController';
import { ICharacterEncyclopediaService } from '../../services/CharacterEncyclopediaService';
import { IAuditLogRepository } from '../../repositories/AuditLogRepository';
import { CreateCharacterEncyclopediaRequest } from '../../types/characterEncyclopedia';
import mongoose from 'mongoose';

describe('CharacterEncyclopediaController', () => {
  let controller: CharacterEncyclopediaController;
  let mockService: jest.Mocked<ICharacterEncyclopediaService>;
  let mockAuditLogRepository: jest.Mocked<IAuditLogRepository>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockService = {
      createEncyclopedia: jest.fn(),
      getEncyclopediaById: jest.fn(),
      getEncyclopediaByGameAndCharacter: jest.fn(),
      getCurrentEncyclopediaByGameAndCharacter: jest.fn(),
      getEncyclopediasByGame: jest.fn(),
      getGameRules: jest.fn(),
      updateEncyclopedia: jest.fn(),
      updateEncyclopediaByGameAndCharacter: jest.fn(),
      deleteEncyclopedia: jest.fn(),
    } as any;

    mockAuditLogRepository = {
      createAuditLog: jest.fn().mockResolvedValue(undefined),
    } as any;

    controller = new CharacterEncyclopediaController(mockService, mockAuditLogRepository);

    mockRequest = {
      params: {},
      body: {},
      ip: '127.0.0.1',
      headers: {
        'user-agent': 'test-agent',
      },
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  describe('createEncyclopedia', () => {
    it('should create encyclopedia and return 201', async () => {
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

      mockRequest.params = { gameId: 'sf6', characterId: 'ryu' };
      mockRequest.body = request;

      const mockResponseData = {
        _id: new mongoose.Types.ObjectId().toString(),
        ...request,
      };

      mockService.createEncyclopedia.mockResolvedValue({
        success: true,
        data: mockResponseData as any,
        message: 'Created',
      });

      await controller.createEncyclopedia(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockService.createEncyclopedia).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalled();
    });
  });

  describe('getGameRules', () => {
    it('should return game rules', async () => {
      mockRequest.params = { gameId: 'sf6', characterId: 'ryu' };

      const mockRules = [
        {
          key: 'Drive Gauge',
          value: 6,
          ui_type: 'meter',
        },
      ];

      mockService.getGameRules.mockResolvedValue({
        success: true,
        data: mockRules,
      });

      await controller.getGameRules(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockService.getGameRules).toHaveBeenCalledWith('sf6', 'ryu');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getCurrentEncyclopedia', () => {
    it('should return current encyclopedia', async () => {
      mockRequest.params = { gameId: 'sf6', characterId: 'ryu' };

      const mockResponseData = {
        _id: new mongoose.Types.ObjectId().toString(),
        game_id: 'sf6',
        character_id: 'ryu',
        moveset: {
          normals: [],
          specials: [],
          ex_moves: [],
          supers: [],
        },
        game_rules: [],
      };

      mockService.getCurrentEncyclopediaByGameAndCharacter.mockResolvedValue({
        success: true,
        data: mockResponseData as any,
      });

      await controller.getCurrentEncyclopedia(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockService.getCurrentEncyclopediaByGameAndCharacter).toHaveBeenCalledWith('sf6', 'ryu');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });
});
