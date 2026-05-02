import { Router } from 'express';
import { AnalysisController } from '../controllers/AnalysisController';
/**
 * Analysis routes
 * Follows Single Responsibility Principle - handles routing for analysis endpoints
 */
export declare class AnalysisRoutes {
    private router;
    private controller;
    constructor(controller: AnalysisController);
    /**
     * Setup routes
     */
    private setupRoutes;
    /**
     * Get router instance
     */
    getRouter(): Router;
    /**
     * Validation rules for analyze request
     */
    private validateAnalyzeRequest;
    /**
     * Validation rules for get analysis request
     */
    private validateGetAnalysisRequest;
}
//# sourceMappingURL=analysisRoutes.d.ts.map