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
        return this.findOne({ analysis_id: analysisId });
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
}
exports.AnalysisRepository = AnalysisRepository;
//# sourceMappingURL=AnalysisRepository.js.map