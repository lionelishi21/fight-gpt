import { Request, Response } from 'express';
import { BaseController } from './BaseController';
export declare class GamificationController extends BaseController {
    private service;
    constructor();
    /**
     * Get current user's gamification stats
     */
    getMyStats: (req: Request, res: Response) => Promise<void>;
    /**
     * Dev/Test endpoint to add XP manually
     */
    debugAddXp: (req: Request, res: Response) => Promise<void>;
}
//# sourceMappingURL=GamificationController.d.ts.map