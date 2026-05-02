import { Router } from 'express';
import { HealthController } from '../controllers/HealthController';
/**
 * Health routes
 * Follows Single Responsibility Principle - handles routing for health endpoints
 */
export declare class HealthRoutes {
    private router;
    private controller;
    constructor(controller: HealthController);
    /**
     * Setup routes
     */
    private setupRoutes;
    /**
     * Get router instance
     */
    getRouter(): Router;
}
//# sourceMappingURL=healthRoutes.d.ts.map