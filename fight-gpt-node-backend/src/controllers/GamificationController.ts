import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import User from '../models/User';
import { Analysis } from '../models/Analysis';
import UserMission from '../models/UserMission';
import { progressionFor } from '../helpers/progression';

export class GamificationController extends BaseController {
    /** GET /gamification/stats — progression, streaks and activity counts for Home and Profile */
    public getStats = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = (req as any).user.id;
            const [user, vodCount, drillsCompleted] = await Promise.all([
                User.findById(userId).select('gamification').lean(),
                Analysis.countDocuments({ user_id: String(userId) }),
                UserMission.countDocuments({ user: userId, status: 'COMPLETED' }),
            ]);
            if (!user) {
                this.sendError(res, 'User not found', 404);
                return;
            }

            const g: any = user.gamification || {};
            this.sendResponse(res, {
                success: true,
                data: {
                    // Derived from XP, so stored level/rank that predate the ladder still show correctly
                    ...progressionFor(Number(g.xp) || 0),
                    missionStreak: g.missionStreak ?? 0,
                    longestStreak: g.longestStreak ?? 0,
                    vodCount,
                    drillsCompleted,
                    stats: g.stats || {},
                },
            });
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to fetch stats');
        }
    };
}
