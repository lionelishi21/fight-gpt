import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import User from '../models/User';
import { levelForXp, nextLevelXp } from '../helpers/progression';

export class GamificationController extends BaseController {
    /** GET /gamification/stats — XP, level and skill stats for the Home progress bar */
    public getStats = async (req: Request, res: Response): Promise<void> => {
        try {
            const user = await User.findById((req as any).user.id).select('gamification').lean();
            if (!user) {
                this.sendError(res, 'User not found', 404);
                return;
            }

            const g: any = user.gamification || {};
            const xp = Number(g.xp) || 0;
            this.sendResponse(res, {
                success: true,
                data: {
                    xp,
                    level: levelForXp(xp),
                    rank: g.rank || 'Rookie',
                    nextLevelXp: nextLevelXp(xp),
                    missionStreak: g.missionStreak ?? 0,
                    longestStreak: g.longestStreak ?? 0,
                    stats: g.stats || {},
                },
            });
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to fetch stats');
        }
    };
}
