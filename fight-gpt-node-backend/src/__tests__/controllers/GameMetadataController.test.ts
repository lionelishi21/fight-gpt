/**
 * GameMetadataController Unit Tests
 */

import { Request, Response, NextFunction } from 'express';
import { GameMetadataController } from '../../controllers/GameMetadataController';
import { IGameMetadataService } from '../../services/GameMetadataService';
import { IAuditLogRepository } from '../../repositories/AuditLogRepository';
import { CreateGameMetadataRequest } from '../../types/gameMetadata';
import mongoose from 'mongoose';

describe('GameMetadataController', () => {
  let controller: GameMetadataController;
  let mockService: jest.Mocked<IGameMetadataService>;
  let mockAuditLogRepository: jest.Mocked<IAuditLogRepository>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockService = {
      createGameMetadata: jest.fn(),
      getGameMetadataById: jest.fn(),
      getGameMetadataByGameId: jest.fn(),
      getCurrentGameMetadataByGameId: jest.fn(),
      updateGameMetadata: jest.fn(),
      updateGameMetadataByGameId: jest.fn(),
      deleteGameMetadata: jest.fn(),
    } as any;

    mockAuditLogRepository = {
      createAuditLog: jest.fn().mockResolvedValue(undefined),
    } as any;

    controller = new GameMetadataController(mockService, mockAuditLogRepository);

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

  describe('createGameMetadata', () => {
    it('should create game metadata and return 201', async () => {
      const request: CreateGameMetadataRequest = {
        game_id: 'sf6',
        global_mechanics: [],
        constants: {},
      };

      mockRequest.params = { gameId: 'sf6' };
      mockRequest.body = request;

      const mockResponseData = {
        _id: new mongoose.Types.ObjectId().toString(),
        game_id: 'sf6',
        global_mechanics: [],
        constants: {},
      };

      mockService.createGameMetadata.mockResolvedValue({
        success: true,
        data: mockResponseData as any,
        message: 'Created',
      });

      await controller.createGameMetadata(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockService.createGameMetadata).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalled();
    });

    it('should handle errors and call next', async () => {
      mockRequest.params = { gameId: 'sf6' };
      mockRequest.body = {};

      mockService.createGameMetadata.mockRejectedValue(new Error('Test error'));

      await controller.createGameMetadata(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getCurrentGameMetadata', () => {
    it('should return current game metadata', async () => {
      mockRequest.params = { gameId: 'sf6' };

      const mockResponseData = {
        _id: new mongoose.Types.ObjectId().toString(),
        game_id: 'sf6',
        global_mechanics: [],
        constants: {},
      };

      mockService.getCurrentGameMetadataByGameId.mockResolvedValue({
        success: true,
        data: mockResponseData as any,
      });

      await controller.getCurrentGameMetadata(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockService.getCurrentGameMetadataByGameId).toHaveBeenCalledWith('sf6');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalled();
    });

    it('should return 404 if not found', async () => {
      mockRequest.params = { gameId: 'sf6' };

      mockService.getCurrentGameMetadataByGameId.mockResolvedValue({
        success: false,
        error: 'Not found',
      });

      await controller.getCurrentGameMetadata(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });
  });

  describe('updateGameMetadataByGameId', () => {
    it('should update game metadata successfully', async () => {
      mockRequest.params = { gameId: 'sf6' };
      mockRequest.body = { patch_version: '1.06' };

      const mockResponseData = {
        _id: new mongoose.Types.ObjectId().toString(),
        game_id: 'sf6',
        patch_version: '1.06',
      };

      mockService.updateGameMetadataByGameId.mockResolvedValue({
        success: true,
        data: mockResponseData as any,
      });

      await controller.updateGameMetadataByGameId(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockService.updateGameMetadataByGameId).toHaveBeenCalledWith('sf6', {
        patch_version: '1.06',
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });

  describe('deleteGameMetadata', () => {
    it('should delete game metadata successfully', async () => {
      const mockId = new mongoose.Types.ObjectId().toString();
      mockRequest.params = { id: mockId };

      mockService.deleteGameMetadata.mockResolvedValue({
        success: true,
        data: true,
      });

      await controller.deleteGameMetadata(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockService.deleteGameMetadata).toHaveBeenCalledWith(mockId);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });
});
