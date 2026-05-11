"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalysisRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
const Analysis_1 = require("../models/Analysis");
/**
 * Analysis repository implementation
 * Follows Single Responsibility Principle - handles only analysis data operations
 * Follows Open/Closed Principle - extends BaseRepository without modifying it
 */
class AnalysisRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super(Analysis_1.Analysis);
    }
    /**
     * Find analysis by YouTube URL
     */
    async findByYouTubeUrl(youtubeUrl) {
        return this.findOne({ youtube_url: youtubeUrl, video_source: 'youtube' });
    }
    /**
     * Find analysis by video path
     */
    async findByVideoPath(videoPath) {
        return this.findOne({ video_path: videoPath, video_source: 'local_file' });
    }
    /**
     * Find analysis by analysis ID
     */
    async findByAnalysisId(analysisId) {
        // Primary lookup by UUID analysis_id; fall back to MongoDB _id for older links
        const byUuid = await this.findOne({ analysis_id: analysisId });
        if (byUuid)
            return byUuid;
        try {
            return await this.findOne({ _id: analysisId });
        }
        catch {
            return null;
        }
    }
    /**
     * Get recent analyses
     */
    async getRecentAnalyses(limit, userId, gameId) {
        const filter = {};
        if (userId)
            filter.user_id = userId;
        if (gameId)
            filter.game_id = gameId;
        return this.findMany(filter, { sort: { created_at: -1 }, limit });
    }
    /**
     * Create new analysis record
     */
    async createAnalysis(request, response, analysisId, userId) {
        const videoSource = request.youtube_url ? 'youtube' : 'local_file';
        const data = {
            youtube_url: request.youtube_url,
            video_path: request.video_path,
            video_source: videoSource,
            game_id: request.game_id,
            analysis: response,
            analysis_id: analysisId,
            p1_name: response.p1_name,
            p2_name: response.p2_name,
            ...(userId ? { user_id: userId } : {}),
        };
        return this.create(data);
    }
    /**
     * Count analyses created by a user within a certain time window
     */
    async countRecentAnalysesByUser(userId, hours) {
        const dateLimit = new Date();
        dateLimit.setHours(dateLimit.getHours() - hours);
        return this.model.countDocuments({
            user_id: userId,
            created_at: { $gte: dateLimit }
        });
    }
    /**
     * Get analyses for the discovery feed with optional matchup filtering
     */
    async getDiscoveryAnalyses(limit, gameId, p1Char, p2Char) {
        const filter = { video_source: 'youtube' };
        if (gameId)
            filter.game_id = gameId;
        if (p1Char && p2Char) {
            // Specific matchup (bidirectional)
            filter.$or = [
                { 'analysis.p1_character': p1Char, 'analysis.p2_character': p2Char },
                { 'analysis.p1_character': p2Char, 'analysis.p2_character': p1Char },
            ];
        }
        else if (p1Char) {
            // Any vs p1Char
            filter.$or = [
                { 'analysis.p1_character': p1Char },
                { 'analysis.p2_character': p1Char },
            ];
        }
        return this.findMany(filter, { sort: { created_at: -1 }, limit });
    }
    /**
     * Increment view count for a discovery record
     */
    async incrementViewCount(analysisId) {
        await this.model.updateOne({ $or: [{ analysis_id: analysisId }, { _id: analysisId }] }, { $inc: { view_count: 1 } });
    }
    /**
     * Increment click count for a discovery record
     */
    async incrementClickCount(analysisId) {
        await this.model.updateOne({ $or: [{ analysis_id: analysisId }, { _id: analysisId }] }, { $inc: { click_count: 1 } });
    }
}
exports.AnalysisRepository = AnalysisRepository;
//# sourceMappingURL=AnalysisRepository.js.map