import { Request, Response, NextFunction } from 'express';
import { CreateGameMetadataRequest, UpdateGameMetadataRequest } from '../types/gameMetadata';
import { BaseController } from './BaseController';
import { IGameMetadataService } from '../services/GameMetadataService';
import { IAuditLogRepository } from '../repositories/AuditLogRepository';

/**
 * Game Metadata controller interface
 * Follows Interface Segregation Principle
 */
export interface IGameMetadataController {
  createGameMetadata(req: Request, res: Response, next: NextFunction): Promise<void>;
  getGameMetadataById(req: Request, res: Response, next: NextFunction): Promise<void>;
  getGameMetadataByGameId(req: Request, res: Response, next: NextFunction): Promise<void>;
  getCurrentGameMetadata(req: Request, res: Response, next: NextFunction): Promise<void>;
  updateGameMetadata(req: Request, res: Response, next: NextFunction): Promise<void>;
  updateGameMetadataByGameId(req: Request, res: Response, next: NextFunction): Promise<void>;
  deleteGameMetadata(req: Request, res: Response, next: NextFunction): Promise<void>;
}

/**
 * Game Metadata controller implementation
 * Follows Single Responsibility Principle - handles HTTP requests/responses for game metadata
 * Follows Dependency Inversion Principle - depends on service interface
 */
export class GameMetadataController extends BaseController implements IGameMetadataController {
  constructor(
    private readonly gameMetadataService: IGameMetadataService,
    private readonly auditLogRepository: IAuditLogRepository
  ) {
    super();
  }

  /**
   * Create game metadata endpoint handler
   * POST /api/games/:gameId/metadata
   */
  async createGameMetadata(req: Request, res: Response, next: NextFunction): Promise<void> {
    const requestId = this.getRequestId(req);
    const startTime = Date.now();

    try {
      const { gameId } = req.params;
      const request: CreateGameMetadataRequest = {
        ...req.body,
        game_id: gameId || req.body.game_id, // Use gameId from params if provided
      };

      const result = await this.gameMetadataService.createGameMetadata(request);

      const responseTime = Date.now() - startTime;

      await this.auditLogRepository.createAuditLog({
        request_id: requestId,
        endpoint: `/api/games/${gameId}/metadata`,
        method: 'POST',
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        request_body: request as unknown as Record<string, unknown>,
        response_status: result.success ? 201 : 400,
        response_time_ms: responseTime,
      });

      const statusCode = result.success ? 201 : 400;
      this.sendResponse(res, result, statusCode);
    } catch (error) {
      const responseTime = Date.now() - startTime;

      await this.auditLogRepository.createAuditLog({
        request_id: requestId,
        endpoint: `/api/games/${req.params.gameId}/metadata`,
        method: 'POST',
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        request_body: req.body,
        response_status: 500,
        response_time_ms: responseTime,
        error_message: error instanceof Error ? error.message : 'Unknown error',
      }).catch((err) => {
        console.error('[GameMetadataController] Failed to create audit log:', err);
      });

      this.handleError(error, req, res, next);
    }
  }

  /**
   * Get game metadata by MongoDB ID endpoint handler
   * GET /api/metadata/:id
   */
  async getGameMetadataById(req: Request, res: Response, next: NextFunction): Promise<void> {
    const requestId = this.getRequestId(req);
    const startTime = Date.now();

    try {
      const { id } = req.params;

      if (!id) {
        this.sendResponse(res, { success: false, error: 'Metadata ID is required' }, 400);
        return;
      }

      const result = await this.gameMetadataService.getGameMetadataById(id);

      const responseTime = Date.now() - startTime;

      await this.auditLogRepository.createAuditLog({
        request_id: requestId,
        endpoint: `/api/metadata/${id}`,
        method: 'GET',
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        response_status: result.success ? 200 : 404,
        response_time_ms: responseTime,
      });

      const statusCode = result.success ? 200 : 404;
      this.sendResponse(res, result, statusCode);
    } catch (error) {
      this.handleError(error, req, res, next);
    }
  }

  /**
   * Get game metadata by game_id endpoint handler
   * GET /api/games/:gameId/metadata
   */
  async getGameMetadataByGameId(req: Request, res: Response, next: NextFunction): Promise<void> {
    const requestId = this.getRequestId(req);
    const startTime = Date.now();

    try {
      const { gameId } = req.params;

      if (!gameId) {
        this.sendResponse(res, { success: false, error: 'Game ID is required' }, 400);
        return;
      }

      const result = await this.gameMetadataService.getGameMetadataByGameId(gameId);

      const responseTime = Date.now() - startTime;

      await this.auditLogRepository.createAuditLog({
        request_id: requestId,
        endpoint: `/api/games/${gameId}/metadata`,
        method: 'GET',
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        response_status: result.success ? 200 : 404,
        response_time_ms: responseTime,
      });

      const statusCode = result.success ? 200 : 404;
      this.sendResponse(res, result, statusCode);
    } catch (error) {
      this.handleError(error, req, res, next);
    }
  }

  /**
   * Get current game metadata by game_id endpoint handler (for AI service)
   * GET /api/games/:gameId/metadata/current
   */
  async getCurrentGameMetadata(req: Request, res: Response, next: NextFunction): Promise<void> {
    const requestId = this.getRequestId(req);
    const startTime = Date.now();

    try {
      const { gameId } = req.params;

      if (!gameId) {
        this.sendResponse(res, { success: false, error: 'Game ID is required' }, 400);
        return;
      }

      const result = await this.gameMetadataService.getCurrentGameMetadataByGameId(gameId);

      const responseTime = Date.now() - startTime;

      await this.auditLogRepository.createAuditLog({
        request_id: requestId,
        endpoint: `/api/games/${gameId}/metadata/current`,
        method: 'GET',
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        response_status: result.success ? 200 : 404,
        response_time_ms: responseTime,
      });

      const statusCode = result.success ? 200 : 404;
      this.sendResponse(res, result, statusCode);
    } catch (error) {
      this.handleError(error, req, res, next);
    }
  }

  /**
   * Update game metadata by MongoDB ID endpoint handler
   * PUT /api/metadata/:id
   */
  async updateGameMetadata(req: Request, res: Response, next: NextFunction): Promise<void> {
    const requestId = this.getRequestId(req);
    const startTime = Date.now();

    try {
      const { id } = req.params;
      const request: UpdateGameMetadataRequest = req.body;

      if (!id) {
        this.sendResponse(res, { success: false, error: 'Metadata ID is required' }, 400);
        return;
      }

      const result = await this.gameMetadataService.updateGameMetadata(id, request);

      const responseTime = Date.now() - startTime;

      await this.auditLogRepository.createAuditLog({
        request_id: requestId,
        endpoint: `/api/metadata/${id}`,
        method: 'PUT',
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        request_body: request as unknown as Record<string, unknown>,
        response_status: result.success ? 200 : 404,
        response_time_ms: responseTime,
      });

      const statusCode = result.success ? 200 : 404;
      this.sendResponse(res, result, statusCode);
    } catch (error) {
      this.handleError(error, req, res, next);
    }
  }

  /**
   * Update game metadata by game_id endpoint handler
   * PUT /api/games/:gameId/metadata
   */
  async updateGameMetadataByGameId(req: Request, res: Response, next: NextFunction): Promise<void> {
    const requestId = this.getRequestId(req);
    const startTime = Date.now();

    try {
      const { gameId } = req.params;
      const request: UpdateGameMetadataRequest = req.body;

      if (!gameId) {
        this.sendResponse(res, { success: false, error: 'Game ID is required' }, 400);
        return;
      }

      const result = await this.gameMetadataService.updateGameMetadataByGameId(gameId, request);

      const responseTime = Date.now() - startTime;

      await this.auditLogRepository.createAuditLog({
        request_id: requestId,
        endpoint: `/api/games/${gameId}/metadata`,
        method: 'PUT',
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        request_body: request as unknown as Record<string, unknown>,
        response_status: result.success ? 200 : 404,
        response_time_ms: responseTime,
      });

      const statusCode = result.success ? 200 : 404;
      this.sendResponse(res, result, statusCode);
    } catch (error) {
      this.handleError(error, req, res, next);
    }
  }

  /**
   * Delete game metadata endpoint handler
   * DELETE /api/metadata/:id
   */
  async deleteGameMetadata(req: Request, res: Response, next: NextFunction): Promise<void> {
    const requestId = this.getRequestId(req);
    const startTime = Date.now();

    try {
      const { id } = req.params;

      if (!id) {
        this.sendResponse(res, { success: false, error: 'Metadata ID is required' }, 400);
        return;
      }

      const result = await this.gameMetadataService.deleteGameMetadata(id);

      const responseTime = Date.now() - startTime;

      await this.auditLogRepository.createAuditLog({
        request_id: requestId,
        endpoint: `/api/metadata/${id}`,
        method: 'DELETE',
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        response_status: result.success ? 200 : 404,
        response_time_ms: responseTime,
      });

      const statusCode = result.success ? 200 : 404;
      this.sendResponse(res, result, statusCode);
    } catch (error) {
      this.handleError(error, req, res, next);
    }
  }
}
