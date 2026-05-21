import { Router, Request, Response, NextFunction } from 'express';
import { body, param, ValidationChain } from 'express-validator';
import { AnalysisController } from '../controllers/AnalysisController';
import { validateRequest } from '../middleware/validationMiddleware';
import { optionalAuthMiddleware } from '../middleware/auth';
import { UserEventFlag } from '../models/UserEventFlag';
import { Analysis } from '../models/Analysis';
import { authMiddleware } from '../middleware/auth';

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

    // POST /api/analysis/:id/verify - Verify mission success
    this.router.post(
      '/:id/verify',
      optionalAuthMiddleware,
      validateRequest,
      (req: Request, res: Response, next: NextFunction) => this.controller.verifyMission(req, res, next)
    );

    // Engagement Tracking
    this.router.post(
      '/discovery/track-view',
      optionalAuthMiddleware,
      (req: Request, res: Response, next: NextFunction) => this.controller.trackDiscoveryView(req, res, next)
    );

    this.router.post(
      '/discovery/:id/track-click',
      (req: Request, res: Response, next: NextFunction) => this.controller.trackDiscoveryClick(req, res, next)
    );

    this.router.get(
      '/discovery/views',
      optionalAuthMiddleware,
      (req: Request, res: Response, next: NextFunction) => this.controller.getUserDiscoveryViews(req, res, next)
    );

    // User event flagging — any authenticated user can flag a wrong event
    this.router.post('/:id/flag', authMiddleware, async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user?._id || (req as any).user?.id;
        const { event_node_id, timestamp, reason, note } = req.body;
        if (!event_node_id || !reason) {
          res.status(400).json({ success: false, error: 'event_node_id and reason are required' });
          return;
        }
        const analysis = await Analysis.findOne({
          $or: [{ _id: req.params.id }, { analysis_id: req.params.id }],
        }).lean() as any;

        await UserEventFlag.create({
          analysis_id:  req.params.id,
          event_node_id,
          timestamp:    timestamp || '',
          game_id:      analysis?.game_id || 'unknown',
          reason,
          note:         note?.slice(0, 500),
          user_id:      String(userId),
        });
        res.json({ success: true, message: 'Flag submitted — thank you.' });
      } catch (err: any) {
        // Duplicate flag from same user on same event — silent success
        if (err.code === 11000) { res.json({ success: true, message: 'Already flagged.' }); return; }
        res.status(500).json({ success: false, error: 'Failed to submit flag' });
      }
    });

    // Get flag count for an analysis (admin use)
    this.router.get('/:id/flags', authMiddleware, async (req: Request, res: Response) => {
      try {
        const flags = await UserEventFlag.find({ analysis_id: req.params.id }).lean();
        res.json({ success: true, data: flags });
      } catch {
        res.status(500).json({ success: false, error: 'Failed to fetch flags' });
      }
    });
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
        .custom(v => /^[0-9a-f-]{8,}$/i.test(v))
        .withMessage('Analysis ID must be a valid UUID or MongoDB ObjectId'),
    ];
  }
}

