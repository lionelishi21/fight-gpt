import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { EngagementService } from '../services/EngagementService';
export declare class EngagementController extends BaseController {
    private readonly engagementService;
    constructor(engagementService: EngagementService);
    /**
     * POST /api/engagement/submit
     * Submit rating and comment
     */
    submit: (req: Request, res: Response) => Promise<void>;
    /**
     * GET /api/engagement/:targetId
     * Get stats and comments for a target
     */
    getTargetStats: (req: Request, res: Response) => Promise<void>;
}
//# sourceMappingURL=EngagementController.d.ts.map