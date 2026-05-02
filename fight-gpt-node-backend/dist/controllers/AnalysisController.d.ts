import { Request, Response, NextFunction } from 'express';
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
export declare class AnalysisController extends BaseController implements IAnalysisController {
    private readonly analysisService;
    private readonly auditLogRepository;
    constructor(analysisService: IAnalysisService, auditLogRepository: IAuditLogRepository);
    /**
     * Analyze video endpoint handler
     * POST /api/analyze
     */
    analyzeVideo(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get analysis by ID endpoint handler
     * GET /api/analysis/:id
     */
    getAnalysis(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get recent analyses endpoint handler
     * GET /api/analysis/recent
     */
    getRecentAnalyses(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get discovery analyses endpoint handler
     * GET /api/analysis/discovery
     */
    getDiscoveryAnalyses(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Verify mission success for an analysis
     * POST /api/analysis/:id/verify
     */
    verifyMission(req: Request, res: Response, next: NextFunction): Promise<void>;
}
//# sourceMappingURL=AnalysisController.d.ts.map