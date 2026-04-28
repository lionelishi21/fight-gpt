import { Router, Request, Response, NextFunction } from 'express';
import { body, param, ValidationChain } from 'express-validator';
import { AnalysisController } from '../controllers/AnalysisController';
import { validateRequest } from '../middleware/validationMiddleware';
import { optionalAuthMiddleware } from '../middleware/auth';

/**
 * Analysis routes
 * Follows Single Responsibility Principle - handles routing for analysis endpoints
 */
export class AnalysisRoutes {
  private router: Router;
  private controller: AnalysisController;

  constructor(controller: AnalysisController) {
    this.router = Router();
    this.controller = controller;
    this.setupRoutes();
  }

  /**
   * Setup routes
   */
  private setupRoutes(): void {
    // POST /api/analyze - Analyze video (optionalAuth tags the analysis to the user)
    this.router.post(
      '/',
      optionalAuthMiddleware,
      this.validateAnalyzeRequest(),
      validateRequest,
      (req: Request, res: Response, next: NextFunction) => this.controller.analyzeVideo(req, res, next)
    );

    // GET /api/analysis/recent - Get recent analyses for the signed-in user only
    this.router.get(
      '/recent',
      optionalAuthMiddleware,
      validateRequest,
      (req: Request, res: Response, next: NextFunction) => this.controller.getRecentAnalyses(req, res, next)
    );
    
    // GET /api/analysis/discovery - Get all recent analyses (public discovery)
    this.router.get(
      '/discovery',
      validateRequest,
      (req: Request, res: Response, next: NextFunction) => this.controller.getDiscoveryAnalyses(req, res, next)
    );

    // GET /api/analysis/:id - Get analysis by ID
    this.router.get(
      '/:id',
      this.validateGetAnalysisRequest(),
      validateRequest,
      (req: Request, res: Response, next: NextFunction) => this.controller.getAnalysis(req, res, next)
    );
  }

  /**
   * Get router instance
   */
  public getRouter(): Router {
    return this.router;
  }

  /**
   * Validation rules for analyze request
   */
  private validateAnalyzeRequest(): ValidationChain[] {
    return [
      body('youtube_url')
        .optional()
        .isURL()
        .withMessage('youtube_url must be a valid URL')
        .custom((value, { req }) => {
          if (!value && !req.body.video_path) {
            throw new Error('Either youtube_url or video_path must be provided');
          }
          if (value && req.body.video_path) {
            throw new Error('Cannot provide both youtube_url and video_path');
          }
          return true;
        }),
      body('video_path')
        .optional()
        .isString()
        .withMessage('video_path must be a string'),
      body('game_id').optional().isString().withMessage('game_id must be a string'),
    ];
  }

  /**
   * Validation rules for get analysis request
   */
  private validateGetAnalysisRequest(): ValidationChain[] {
    return [
      param('id')
        .notEmpty()
        .withMessage('Analysis ID is required')
        .isUUID()
        .withMessage('Analysis ID must be a valid UUID'),
    ];
  }
}

