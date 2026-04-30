import { BaseService } from './BaseService';
import Engagement, { IEngagement, EngagementTargetType } from '../models/Engagement';
import { TheoryDoc } from '../models/TheoryDocument';
import { Scenario } from '../models/Scenario';
import { ITheoryService } from './TheoryService';
import mongoose from 'mongoose';
import { ApiResponse } from '../types';

export class EngagementService extends BaseService {
    constructor(
        private readonly theoryService: ITheoryService
    ) {
        super();
    }

    /**
     * Submit a rating and optional comment for a target entity
     */
    async submitEngagement(
        userId: string,
        targetId: string,
        targetType: EngagementTargetType,
        rating: number,
        comment?: string
    ): Promise<ApiResponse<IEngagement>> {
        try {
            // Upsert engagement (one per user per target)
            const engagement = await Engagement.findOneAndUpdate(
                { userId: new mongoose.Types.ObjectId(userId), targetId },
                { targetType, rating, comment, isAiReviewTriggered: false },
                { upsert: true, new: true }
            );

            // Check if this triggers an AI review
            await this.checkAndTriggerAiReview(targetId, targetType);

            return { success: true, data: engagement };
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Failed to submit engagement' };
        }
    }

    /**
     * Get engagement stats and comments for a target
     */
    async getTargetEngagement(targetId: string): Promise<ApiResponse<{
        averageRating: number;
        totalRatings: number;
        comments: Array<{ username: string; comment: string; rating: number; date: Date }>;
    }>> {
        try {
            const engagements = await Engagement.find({ targetId })
                .populate('userId', 'username')
                .sort({ createdAt: -1 })
                .lean()
                .exec();

            if (engagements.length === 0) {
                return { 
                    success: true, 
                    data: { averageRating: 0, totalRatings: 0, comments: [] } 
                };
            }

            const total = engagements.length;
            const sum = engagements.reduce((acc, curr) => acc + curr.rating, 0);
            const comments = engagements
                .filter(e => e.comment)
                .map(e => ({
                    username: (e.userId as any)?.username || 'Anonymous Operator',
                    comment: e.comment!,
                    rating: e.rating,
                    date: e.createdAt
                }));

            return {
                success: true,
                data: {
                    averageRating: Number((sum / total).toFixed(1)),
                    totalRatings: total,
                    comments
                }
            };
        } catch (error) {
            return { success: false, error: 'Failed to fetch engagement stats' };
        }
    }

    /**
     * Logic to trigger AI re-generation if feedback is consistently negative
     */
    private async checkAndTriggerAiReview(targetId: string, targetType: EngagementTargetType): Promise<void> {
        if (targetType !== 'theory') return; // For now, only auto-correct theories

        const stats = await Engagement.aggregate([
            { $match: { targetId } },
            { $group: { _id: '$targetId', avg: { $sum: '$rating' }, count: { $sum: 1 } } }
        ]);

        if (stats.length === 0) return;
        const { avg, count } = stats[0];
        const average = avg / count;

        // Trigger if: 3+ ratings AND average < 3.0
        if (count >= 3 && average < 3.0) {
            const alreadyTriggered = await Engagement.findOne({ targetId, isAiReviewTriggered: true });
            if (alreadyTriggered) return;

            console.log(`[Engagement] Triggering AI correction for theory: ${targetId} (Avg: ${average})`);

            // Fetch comments to use as corrective context
            const comments = await Engagement.find({ targetId, comment: { $exists: true } })
                .limit(5)
                .lean()
                .exec();
            
            const feedbackContext = comments.map(c => c.comment).join(' | ');

            // Mark as triggered
            await Engagement.updateMany({ targetId }, { isAiReviewTriggered: true });

            // Trigger re-generation
            const theory = await TheoryDoc.findOne({ theory_id: targetId }).lean().exec();
            if (theory) {
                if (theory.type === 'character') {
                    await this.theoryService.generateCharacterTheory(
                        theory.game_id, 
                        theory.character_id!, 
                        theory.target_skill_level as any
                        // TODO: Add correctionFeedback param to TheoryService
                    );
                } else if (theory.type === 'matchup') {
                    await this.theoryService.generateMatchupTheory(
                        theory.game_id,
                        theory.character_a!,
                        theory.character_b!,
                        theory.target_skill_level as any
                    );
                }
            }
        }
    }
}
