"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EngagementService = void 0;
const BaseService_1 = require("./BaseService");
const Engagement_1 = __importDefault(require("../models/Engagement"));
const TheoryDocument_1 = require("../models/TheoryDocument");
const mongoose_1 = __importDefault(require("mongoose"));
class EngagementService extends BaseService_1.BaseService {
    theoryService;
    constructor(theoryService) {
        super();
        this.theoryService = theoryService;
    }
    /**
     * Submit a rating and optional comment for a target entity
     */
    async submitEngagement(userId, targetId, targetType, rating, comment) {
        try {
            // Upsert engagement (one per user per target)
            const engagement = await Engagement_1.default.findOneAndUpdate({ userId: new mongoose_1.default.Types.ObjectId(userId), targetId }, { targetType, rating, comment, isAiReviewTriggered: false }, { upsert: true, new: true });
            // Check if this triggers an AI review
            await this.checkAndTriggerAiReview(targetId, targetType);
            return { success: true, data: engagement };
        }
        catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Failed to submit engagement' };
        }
    }
    /**
     * Get engagement stats and comments for a target
     */
    async getTargetEngagement(targetId) {
        try {
            const engagements = await Engagement_1.default.find({ targetId })
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
                username: e.userId?.username || 'Anonymous Operator',
                comment: e.comment,
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
        }
        catch (error) {
            return { success: false, error: 'Failed to fetch engagement stats' };
        }
    }
    /**
     * Logic to trigger AI re-generation if feedback is consistently negative
     */
    async checkAndTriggerAiReview(targetId, targetType) {
        if (targetType !== 'theory')
            return; // For now, only auto-correct theories
        const stats = await Engagement_1.default.aggregate([
            { $match: { targetId } },
            { $group: { _id: '$targetId', avg: { $sum: '$rating' }, count: { $sum: 1 } } }
        ]);
        if (stats.length === 0)
            return;
        const { avg, count } = stats[0];
        const average = avg / count;
        // Trigger if: 3+ ratings AND average < 3.0
        if (count >= 3 && average < 3.0) {
            const alreadyTriggered = await Engagement_1.default.findOne({ targetId, isAiReviewTriggered: true });
            if (alreadyTriggered)
                return;
            console.log(`[Engagement] Triggering AI correction for theory: ${targetId} (Avg: ${average})`);
            // Fetch comments to use as corrective context
            const comments = await Engagement_1.default.find({ targetId, comment: { $exists: true } })
                .limit(5)
                .lean()
                .exec();
            const feedbackContext = comments.map(c => c.comment).join(' | ');
            // Mark as triggered
            await Engagement_1.default.updateMany({ targetId }, { isAiReviewTriggered: true });
            // Trigger re-generation
            const theory = await TheoryDocument_1.TheoryDoc.findOne({ theory_id: targetId }).lean().exec();
            if (theory) {
                if (theory.type === 'character') {
                    await this.theoryService.generateCharacterTheory(theory.game_id, theory.character_id, theory.target_skill_level, feedbackContext);
                }
                else if (theory.type === 'matchup') {
                    await this.theoryService.generateMatchupTheory(theory.game_id, theory.character_a, theory.character_b, theory.target_skill_level, feedbackContext);
                }
            }
        }
    }
}
exports.EngagementService = EngagementService;
//# sourceMappingURL=EngagementService.js.map