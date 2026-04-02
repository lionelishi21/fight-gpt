import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { GamificationService } from '../services/GamificationService';

export class GamificationController extends BaseController {
    private service: GamificationService;

    constructor() {
        super();
        this.service = new GamificationService();
    }

    /**
     * Get current user's gamification stats
     */
    public getMyStats = async (req: Request, res: Response): Promise<void> => {
        try {
            // @ts-ignore - user attached by auth middleware
            const userId = req.user.id;
            const stats = await this.service.getUserStats(userId);

            this.sendResponse(res, {
                success: true,
                data: stats
            });
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to fetch stats', 500);
        }
    };

    /**
     * Dev/Test endpoint to add XP manually
     */
    public debugAddXp = async (req: Request, res: Response): Promise<void> => {
        try {
            // @ts-ignore
            const userId = req.user.id;
            const { amount } = req.body;

            if (!amount || typeof amount !== 'number') {
                this.sendError(res, 'Amount is required and must be a number', 400);
                return;
            }

            const result = await this.service.addXp(userId, amount);

            this.sendResponse(res, {
                success: true,
                data: result,
                message: `Added ${amount} XP`
            });
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to add XP', 500);
        }
    };
}
