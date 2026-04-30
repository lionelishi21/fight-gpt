import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { EngagementService } from '../services/EngagementService';
import { EngagementTargetType } from '../models/Engagement';

export class EngagementController extends BaseController {
    constructor(private readonly engagementService: EngagementService) {
        super();
    }

    /**
     * POST /api/engagement/submit
     * Submit rating and comment
     */
    submit = async (req: Request, res: Response): Promise<void> => {
        try {
            const { targetId, targetType, rating, comment } = req.body;
            const userId = (req as any).user?.id;

            if (!targetId || !targetType || !rating) {
                res.status(400).json({ success: false, error: 'targetId, targetType, and rating are required' });
                return;
            }

            const result = await this.engagementService.submitEngagement(
                userId,
                targetId,
                targetType as EngagementTargetType,
                rating,
                comment
            );

            this.sendResponse(res, result);
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Engagement submission failed');
        }
    };

    /**
     * GET /api/engagement/:targetId
     * Get stats and comments for a target
     */
    getTargetStats = async (req: Request, res: Response): Promise<void> => {
        try {
            const { targetId } = req.params;
            if (!targetId) {
                res.status(400).json({ success: false, error: 'targetId is required' });
                return;
            }

            const result = await this.engagementService.getTargetEngagement(targetId);
            this.sendResponse(res, result);
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to fetch engagement stats');
        }
    };
}
