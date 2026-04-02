import { Request, Response, NextFunction } from 'express';
import {
  CreateCharacterRequest,
  UpdateCharacterRequest,
  CharacterFilters,
  ICharacter,
} from '../types/character';
import { BaseController } from './BaseController';
import { ICharacterService } from '../services/CharacterService';
import { IAuditLogRepository } from '../repositories/AuditLogRepository';
import { ApiResponse } from '../types';

/**
 * Character controller interface
 * Follows Interface Segregation Principle
 */
export interface ICharacterController {
  createCharacter(req: Request, res: Response, next: NextFunction): Promise<void>;
  getCharacterById(req: Request, res: Response, next: NextFunction): Promise<void>;
  updateCharacter(req: Request, res: Response, next: NextFunction): Promise<void>;
  deleteCharacter(req: Request, res: Response, next: NextFunction): Promise<void>;
  getCharactersByGame(req: Request, res: Response, next: NextFunction): Promise<void>;
  getCurrentCharactersByGame(req: Request, res: Response, next: NextFunction): Promise<void>;
  getCharactersByGameAndName(req: Request, res: Response, next: NextFunction): Promise<void>;
  getCharactersByGameAndVersion(req: Request, res: Response, next: NextFunction): Promise<void>;
  getCurrentCharacterByGameAndName(req: Request, res: Response, next: NextFunction): Promise<void>;
  searchCharacters(req: Request, res: Response, next: NextFunction): Promise<void>;
  findCharacters(req: Request, res: Response, next: NextFunction): Promise<void>;
  setCharacterAsCurrent(req: Request, res: Response, next: NextFunction): Promise<void>;
}

/**
 * Character controller implementation
 * Follows Single Responsibility Principle - handles HTTP requests/responses for characters
 * Follows Dependency Inversion Principle - depends on service interface
 */
export class CharacterController extends BaseController implements ICharacterController {
  constructor(
    private readonly characterService: ICharacterService,
    private readonly auditLogRepository: IAuditLogRepository
  ) {
    super();
  }

  /**
   * Create character endpoint handler
   * POST /api/characters
   */
  async createCharacter(req: Request, res: Response, next: NextFunction): Promise<void> {
    const requestId = this.getRequestId(req);
    const startTime = Date.now();

    try {
      const request: CreateCharacterRequest = req.body;

      const result = await this.characterService.createCharacter(request);

      const responseTime = Date.now() - startTime;

      await this.auditLogRepository.createAuditLog({
        request_id: requestId,
        endpoint: '/api/characters',
        method: 'POST',
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        request_body: request,
        response_status: result.success ? 201 : 400,
        response_time_ms: responseTime,
      });

      const statusCode = result.success ? 201 : 400;
      this.sendResponse(res, result, statusCode);
    } catch (error) {
      const responseTime = Date.now() - startTime;

      await this.auditLogRepository.createAuditLog({
        request_id: requestId,
        endpoint: '/api/characters',
        method: 'POST',
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        request_body: req.body,
        response_status: 500,
        response_time_ms: responseTime,
        error_message: error instanceof Error ? error.message : 'Unknown error',
      }).catch((err) => {
        console.error('[CharacterController] Failed to create audit log:', err);
      });

      this.handleError(error, req, res, next);
    }
  }

  /**
   * Get character by ID endpoint handler
   * GET /api/characters/:id
   */
  async getCharacterById(req: Request, res: Response, next: NextFunction): Promise<void> {
    const requestId = this.getRequestId(req);
    const startTime = Date.now();

    try {
      const { id } = req.params;

      if (!id) {
        this.sendResponse(res, { success: false, error: 'Character ID is required' }, 400);
        return;
      }

      const result = await this.characterService.getCharacterById(id);

      const responseTime = Date.now() - startTime;

      await this.auditLogRepository.createAuditLog({
        request_id: requestId,
        endpoint: `/api/characters/${id}`,
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
   * Update character endpoint handler
   * PUT /api/characters/:id
   */
  async updateCharacter(req: Request, res: Response, next: NextFunction): Promise<void> {
    const requestId = this.getRequestId(req);
    const startTime = Date.now();

    try {
      const { id } = req.params;
      const request: UpdateCharacterRequest = req.body;

      if (!id) {
        this.sendResponse(res, { success: false, error: 'Character ID is required' }, 400);
        return;
      }

      const result = await this.characterService.updateCharacter(id, request);

      const responseTime = Date.now() - startTime;

      await this.auditLogRepository.createAuditLog({
        request_id: requestId,
        endpoint: `/api/characters/${id}`,
        method: 'PUT',
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        request_body: request,
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
   * Delete character endpoint handler
   * DELETE /api/characters/:id
   */
  async deleteCharacter(req: Request, res: Response, next: NextFunction): Promise<void> {
    const requestId = this.getRequestId(req);
    const startTime = Date.now();

    try {
      const { id } = req.params;

      if (!id) {
        this.sendResponse(res, { success: false, error: 'Character ID is required' }, 400);
        return;
      }

      const result = await this.characterService.deleteCharacter(id);

      const responseTime = Date.now() - startTime;

      await this.auditLogRepository.createAuditLog({
        request_id: requestId,
        endpoint: `/api/characters/${id}`,
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

  /**
   * Get characters by game endpoint handler
   * GET /api/characters/game/:gameId
   */
  async getCharactersByGame(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { gameId } = req.params;

      if (!gameId) {
        this.sendResponse(res, { success: false, error: 'Game ID is required' }, 400);
        return;
      }

      const result = await this.characterService.getCharactersByGame(gameId);
      this.sendResponse(res, result, result.success ? 200 : 400);
    } catch (error) {
      this.handleError(error, req, res, next);
    }
  }

  /**
   * Get current characters by game endpoint handler
   * GET /api/characters/game/:gameId/current
   */
  async getCurrentCharactersByGame(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { gameId } = req.params;

      if (!gameId) {
        this.sendResponse(res, { success: false, error: 'Game ID is required' }, 400);
        return;
      }

      const result = await this.characterService.getCurrentCharactersByGame(gameId);
      this.sendResponse(res, result, result.success ? 200 : 400);
    } catch (error) {
      this.handleError(error, req, res, next);
    }
  }

  /**
   * Get characters by game and name endpoint handler
   * GET /api/characters/game/:gameId/name/:name
   */
  async getCharactersByGameAndName(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { gameId, name } = req.params;

      if (!gameId || !name) {
        this.sendResponse(
          res,
          { success: false, error: 'Game ID and name are required' },
          400
        );
        return;
      }

      const result = await this.characterService.getCharactersByGameAndName(gameId, name);
      this.sendResponse(res, result, result.success ? 200 : 400);
    } catch (error) {
      this.handleError(error, req, res, next);
    }
  }

  /**
   * Get characters by game and version endpoint handler
   * GET /api/characters/game/:gameId/version/:version
   */
  async getCharactersByGameAndVersion(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { gameId, version } = req.params;

      if (!gameId || !version) {
        this.sendResponse(
          res,
          { success: false, error: 'Game ID and version are required' },
          400
        );
        return;
      }

      const result = await this.characterService.getCharactersByGameAndVersion(gameId, version);
      this.sendResponse(res, result, result.success ? 200 : 400);
    } catch (error) {
      this.handleError(error, req, res, next);
    }
  }

  /**
   * Get current character by game and name endpoint handler
   * GET /api/characters/game/:gameId/name/:name/current
   */
  async getCurrentCharacterByGameAndName(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { gameId, name } = req.params;

      if (!gameId || !name) {
        this.sendResponse(
          res,
          { success: false, error: 'Game ID and name are required' },
          400
        );
        return;
      }

      const result = await this.characterService.getCurrentCharacterByGameAndName(gameId, name);
      const statusCode = result.success ? 200 : 404;
      this.sendResponse(res, result, statusCode);
    } catch (error) {
      this.handleError(error, req, res, next);
    }
  }

  /**
   * Search characters endpoint handler
   * GET /api/characters/search?q=query&gameId=gameId
   */
  async searchCharacters(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { q, gameId } = req.query;

      if (!q || typeof q !== 'string') {
        this.sendResponse(res, { success: false, error: 'Search query (q) is required' }, 400);
        return;
      }

      const result = await this.characterService.searchCharacters(
        q,
        gameId ? (gameId as string) : undefined
      );
      this.sendResponse(res, result, result.success ? 200 : 400);
    } catch (error) {
      this.handleError(error, req, res, next);
    }
  }

  /**
   * Find characters with filters endpoint handler
   * GET /api/characters?gameId=...&name=...&version=...&isCurrent=...
   */
  async findCharacters(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters: CharacterFilters = {
        game_id: req.query.gameId as string,
        name: req.query.name as string,
        version: req.query.version as string,
        is_current:
          req.query.isCurrent !== undefined ? req.query.isCurrent === 'true' : undefined,
      };

      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;

      const result = await this.characterService.findCharacters(filters, limit);
      this.sendResponse(res, result, result.success ? 200 : 400);
    } catch (error) {
      this.handleError(error, req, res, next);
    }
  }

  /**
   * Set character as current endpoint handler
   * PATCH /api/characters/:id/current
   */
  async setCharacterAsCurrent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { isCurrent } = req.body;

      if (!id) {
        this.sendResponse(res, { success: false, error: 'Character ID is required' }, 400);
        return;
      }

      if (typeof isCurrent !== 'boolean') {
        this.sendResponse(
          res,
          { success: false, error: 'isCurrent must be a boolean' },
          400
        );
        return;
      }

      const result = await this.characterService.setCharacterAsCurrent(id, isCurrent);
      const statusCode = result.success ? 200 : 404;
      this.sendResponse(res, result, statusCode);
    } catch (error) {
      this.handleError(error, req, res, next);
    }
  }
}

