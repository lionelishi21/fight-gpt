import { Request, Response } from 'express';
import { HealthResponse, ApiResponse } from '../types';
import { BaseController } from './BaseController';
import { IAiService } from '../services/AiService';

/**
 * Health controller interface
 * Follows Interface Segregation Principle
 */
export interface IHealthController {
  checkHealth(req: Request, res: Response): Promise<void>;
}

/**
 * Health controller implementation
 * Follows Single Responsibility Principle - handles health check requests
 */
export class HealthController extends BaseController implements IHealthController {
  private readonly startTime: number = Date.now();

  constructor(private readonly aiService: IAiService) {
    super();
  }

  /**
   * Health check endpoint handler
   * GET /api/health
   */
  async checkHealth(req: Request, res: Response): Promise<void> {
    try {
      // Check AI service health
      const aiServiceHealthy = await this.aiService.healthCheck();

      const uptime = Math.floor((Date.now() - this.startTime) / 1000);

      const healthResponse: HealthResponse = {
        status: aiServiceHealthy ? 'ok' : 'degraded',
        service: 'fight-gpt-api-gateway',
        timestamp: new Date().toISOString(),
        uptime,
      };

      const apiResponse: ApiResponse<HealthResponse> = {
        success: true,
        data: healthResponse,
      };

      const statusCode = aiServiceHealthy ? 200 : 503;
      this.sendResponse(res, apiResponse, statusCode);
    } catch (error) {
      const healthResponse: HealthResponse = {
        status: 'error',
        service: 'fight-gpt-api-gateway',
        timestamp: new Date().toISOString(),
        uptime: Math.floor((Date.now() - this.startTime) / 1000),
      };

      const apiResponse: ApiResponse<HealthResponse> = {
        success: false,
        data: healthResponse,
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      this.sendResponse(res, apiResponse, 503);
    }
  }
}

