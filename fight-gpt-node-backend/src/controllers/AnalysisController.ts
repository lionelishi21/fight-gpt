import { Request, Response, NextFunction } from 'express';
import { AnalysisRequest, ApiResponse, AnalysisResponse } from '../types';
import { BaseController } from './BaseController';
import { IAnalysisService } from '../services/AnalysisService';
import { IAuditLogRepository } from '../repositories/AuditLogRepository';

/**
 * Analysis controller interface
 * Follows Interface Segregation Principle
 */
export interface IAnalysisController {
  analyzeVideo(req: Request, res: Response, next: NextFunction): Promise<void>;
  getAnalysis(req: Request, res: Response, next: NextFunction): Promise<void>;
  getRecentAnalyses(req: Request, res: Response, next: NextFunction): Promise<void>;
  verifyMission(req: Request, res: Response, next: NextFunction): Promise<void>;
}

/**
 * Analysis controller implementation
 * Follows Single Responsibility Principle - handles HTTP requests/responses for analysis
 * Follows Dependency Inversion Principle - depends on service interface, not implementation
 */
export class AnalysisController extends BaseController implements IAnalysisController {
  constructor(
    private readonly analysisService: IAnalysisService,
    private readonly auditLogRepository: IAuditLogRepository
  ) {
    super();
  }

  /**
   * Analyze video endpoint handler
   * POST /api/analyze
   */
  async analyzeVideo(req: Request, res: Response, next: NextFunction): Promise<void> {
    const requestId = this.getRequestId(req);
    const startTime = Date.now();

    try {
      const request: AnalysisRequest = req.body;

      // Log request
      console.log(`[AnalysisController] Analyze request: ${JSON.stringify(request)}`);

      // Call service — pass userId so the analysis is tagged to the requesting user
      const userId = (req as any).user?.id;
      const result = await this.analysisService.analyzeVideo(request, userId);

      // Calculate response time
      const responseTime = Date.now() - startTime;

      // Log audit
      await this.auditLogRepository.createAuditLog({
        request_id: requestId,
        endpoint: '/api/analyze',
        method: 'POST',
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        request_body: request,
        response_status: result.success ? 200 : 400,
        response_time_ms: responseTime,
      });

      // Send response
      const statusCode = result.success ? 200 : 400;
      this.sendResponse(res, result, statusCode);
    } catch (error) {
      const responseTime = Date.now() - startTime;

      // Log error audit
      await this.auditLogRepository.createAuditLog({
        request_id: requestId,
        endpoint: '/api/analyze',
        method: 'POST',
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        request_body: req.body,
        response_status: 500,
        response_time_ms: responseTime,
        error_message: error instanceof Error ? error.message : 'Unknown error',
      }).catch((err) => {
        console.error('[AnalysisController] Failed to create audit log:', err);
      });

      this.handleError(error, req, res, next);
    }
  }

  /**
   * Get analysis by ID endpoint handler
   * GET /api/analysis/:id
   */
  async getAnalysis(req: Request, res: Response, next: NextFunction): Promise<void> {
    const requestId = this.getRequestId(req);
    const startTime = Date.now();

    try {
      const { id } = req.params;

      if (!id) {
        this.sendResponse(res, { success: false, error: 'Analysis ID is required' }, 400);
        return;
      }

      // Call service
      const result = await this.analysisService.getAnalysis(id);

      // Calculate response time
      const responseTime = Date.now() - startTime;

      // Log audit
      await this.auditLogRepository.createAuditLog({
        request_id: requestId,
        endpoint: `/api/analysis/${id}`,
        method: 'GET',
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        response_status: result.success ? 200 : 404,
        response_time_ms: responseTime,
      });

      // Send response
      const statusCode = result.success ? 200 : 404;
      this.sendResponse(res, result, statusCode);
    } catch (error) {
      const responseTime = Date.now() - startTime;

      // Log error audit
      await this.auditLogRepository.createAuditLog({
        request_id: requestId,
        endpoint: `/api/analysis/${req.params.id}`,
        method: 'GET',
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        response_status: 500,
        response_time_ms: responseTime,
        error_message: error instanceof Error ? error.message : 'Unknown error',
      }).catch((err) => {
        console.error('[AnalysisController] Failed to create audit log:', err);
      });

      this.handleError(error, req, res, next);
    }
  }


  /**
   * Get recent analyses endpoint handler
   * GET /api/analysis/recent
   */
  async getRecentAnalyses(req: Request, res: Response, next: NextFunction): Promise<void> {
    const requestId = this.getRequestId(req);
    const startTime = Date.now();

    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const gameId = req.query.gameId as string;
      const userId = (req as any).user?.id;

      // Call service — filter by the signed-in user's ID and optionally gameId
      const result = await this.analysisService.getRecentAnalyses(limit, userId, gameId);

      // Calculate response time
      const responseTime = Date.now() - startTime;

      // Log audit
      await this.auditLogRepository.createAuditLog({
        request_id: requestId,
        endpoint: '/api/analysis/recent',
        method: 'GET',
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        response_status: result.success ? 200 : 500,
        response_time_ms: responseTime,
      });

      // Send response
      const statusCode = result.success ? 200 : 500;
      this.sendResponse(res, result, statusCode);
    } catch (error) {
      const responseTime = Date.now() - startTime;

      // Log error audit
      await this.auditLogRepository.createAuditLog({
        request_id: requestId,
        endpoint: '/api/analysis/recent',
        method: 'GET',
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        response_status: 500,
        response_time_ms: responseTime,
        error_message: error instanceof Error ? error.message : 'Unknown error',
      }).catch((err) => {
        console.error('[AnalysisController] Failed to create audit log:', err);
      });

      this.handleError(error, req, res, next);
    }
  }

  /**
   * Get discovery analyses endpoint handler
   * GET /api/analysis/discovery
   */
  async getDiscoveryAnalyses(req: Request, res: Response, next: NextFunction): Promise<void> {
    const requestId = this.getRequestId(req);
    const startTime = Date.now();

    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const gameId = req.query.gameId as string;
      const result = await this.analysisService.getDiscoveryAnalyses(limit, gameId);

      const responseTime = Date.now() - startTime;
      await this.auditLogRepository.createAuditLog({
        request_id: requestId,
        endpoint: '/api/analysis/discovery',
        method: 'GET',
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        response_status: result.success ? 200 : 500,
        response_time_ms: responseTime,
      });

      this.sendResponse(res, result, result.success ? 200 : 500);
    } catch (error) {
      this.handleError(error, req, res, next);
    }
  }

  /**
   * Verify mission success for an analysis
   * POST /api/analysis/:id/verify
   */
  async verifyMission(req: Request, res: Response, next: NextFunction): Promise<void> {
    const requestId = this.getRequestId(req);
    const startTime = Date.now();

    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      if (!id || !userId) {
        this.sendResponse(res, { success: false, error: 'Analysis ID and User Auth required' }, 400);
        return;
      }

      // 1. Get the analysis
      const result = await this.analysisService.getAnalysis(id);
      if (!result.success || !result.data) {
        this.sendResponse(res, { success: false, error: 'Analysis not found' }, 404);
        return;
      }

      // 2. Run mission verification
      const { MissionService } = require('../services/MissionService');
      const verifyResult = await MissionService.verifyMissionSuccess(result.data, userId);

      const responseTime = Date.now() - startTime;
      await this.auditLogRepository.createAuditLog({
        request_id: requestId,
        endpoint: `/api/analysis/${id}/verify`,
        method: 'POST',
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        response_status: 200,
        response_time_ms: responseTime,
      });

      this.sendResponse(res, { success: true, data: verifyResult }, 200);
    } catch (error) {
      this.handleError(error, req, res, next);
    }
  }
}

