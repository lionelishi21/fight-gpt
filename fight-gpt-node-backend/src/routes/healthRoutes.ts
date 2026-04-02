import { Router } from 'express';
import { HealthController } from '../controllers/HealthController';

/**
 * Health routes
 * Follows Single Responsibility Principle - handles routing for health endpoints
 */
export class HealthRoutes {
  private router: Router;
  private controller: HealthController;

  constructor(controller: HealthController) {
    this.router = Router();
    this.controller = controller;
    this.setupRoutes();
  }

  /**
   * Setup routes
   */
  private setupRoutes(): void {
    // GET /api/health - Health check
    this.router.get('/', (req, res) => this.controller.checkHealth(req, res));
  }

  /**
   * Get router instance
   */
  public getRouter(): Router {
    return this.router;
  }
}

