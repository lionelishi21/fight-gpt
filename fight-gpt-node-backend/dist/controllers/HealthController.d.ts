import { Request, Response } from 'express';
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
export declare class HealthController extends BaseController implements IHealthController {
    private readonly aiService;
    private readonly startTime;
    constructor(aiService: IAiService);
    /**
     * Health check endpoint handler
     * GET /api/health
     */
    checkHealth(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=HealthController.d.ts.map