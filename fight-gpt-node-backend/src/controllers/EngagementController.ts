import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { BaseController } from './BaseController';
import Engagement, { EngagementTargetType } from '../models/Engagement';

const TARGET_TYPES: EngagementTargetType[] = ['scenario', 'theory', 'match', 'analysis'];
const MAX_COMMENTS = 20;

export class EngagementController extends BaseController {
    /** POST /engagement/submit { targetId, targetType, rating 1-5, comment? } — one rating per user per target */
    public submit = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = (req as any).user.id;
            const { targetId, targetType, comment } = req.body || {};
            const rating = Number(req.body?.rating);

            if (!targetId || !TARGET_TYPES.includes(targetType)) {
                this.sendError(res, `targetId and targetType (${TARGET_TYPES.join(', ')}) are required`, 400);
                return;
            }
            if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
                this.sendError(res, 'rating must be a whole number from 1 to 5', 400);
                return;
            }

            // Re-rating replaces the user's earlier rating
            const engagement = await Engagement.findOneAndUpdate(
                { userId, targetId: String(targetId) },
                { targetType, rating, comment: typeof comment === 'string' ? comment.trim().slice(0, 1000) || undefined : undefined },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
            this.sendResponse(res, { success: true, data: engagement });
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to submit rating');
        }
    };

    /** GET /engagement/:targetId — average, count, and the latest comments */
    public getStats = async (req: Request, res: Response): Promise<void> => {
        try {
            const targetId = String(req.params.targetId);
            const [agg] = await Engagement.aggregate([
                { $match: { targetId } },
                { $group: { _id: null, averageRating: { $avg: '$rating' }, totalRatings: { $sum: 1 } } },
            ]);

            const withComments = await Engagement.find({ targetId, comment: { $nin: [null, ''] } })
                .sort({ updatedAt: -1 })
                .limit(MAX_COMMENTS)
                .populate<{ userId: { name?: string } | mongoose.Types.ObjectId }>('userId', 'name')
                .lean();

            this.sendResponse(res, {
                success: true,
                data: {
                    averageRating: agg ? Math.round(agg.averageRating * 10) / 10 : 0,
                    totalRatings: agg?.totalRatings ?? 0,
                    comments: withComments.map((e: any) => ({
                        userName: e.userId?.name,
                        rating: e.rating,
                        comment: e.comment,
                        createdAt: e.updatedAt,
                    })),
                },
            });
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to fetch ratings');
        }
    };
}
