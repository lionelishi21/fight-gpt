"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const IngestionJob_1 = require("../models/IngestionJob");
const Analysis_1 = require("../models/Analysis");
const User_1 = __importDefault(require("../models/User"));
const Scenario_1 = require("../models/Scenario");
const Character_1 = require("../models/Character");
const Game_1 = require("../models/Game");
const CharacterEncyclopediaRepository_1 = require("../repositories/CharacterEncyclopediaRepository");
const BaseService_1 = require("./BaseService");
class AdminService extends BaseService_1.BaseService {
    async getSystemStats() {
        try {
            const startOfToday = new Date();
            startOfToday.setHours(0, 0, 0, 0);
            const [totalUsers, totalAnalyses, totalScenarios, pendingJobs, failedJobs, dailyAnalyses, dailyScenarios, latestAnalysesToday] = await Promise.all([
                User_1.default.countDocuments(),
                Analysis_1.Analysis.countDocuments(),
                Scenario_1.Scenario.countDocuments(),
                IngestionJob_1.IngestionJob.countDocuments({ status: 'pending' }),
                IngestionJob_1.IngestionJob.countDocuments({ status: 'failed' }),
                Analysis_1.Analysis.countDocuments({ created_at: { $gte: startOfToday } }),
                Scenario_1.Scenario.countDocuments({ created_at: { $gte: startOfToday } }),
                Analysis_1.Analysis.find({ created_at: { $gte: startOfToday } })
                    .sort({ created_at: -1 })
                    .limit(10)
                    .select('analysis_id game_id youtube_url created_at')
                    .lean()
            ]);
            return {
                success: true,
                data: {
                    users: totalUsers,
                    analyses: totalAnalyses,
                    scenarios: totalScenarios,
                    queue: {
                        pending: pendingJobs,
                        failed: failedJobs
                    },
                    daily: {
                        analyses: dailyAnalyses,
                        scenarios: dailyScenarios,
                        latest: latestAnalysesToday
                    }
                }
            };
        }
        catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Unknown systems error' };
        }
    }
    async getIngestionJobs(limit = 20, status, gameId) {
        try {
            const query = {};
            if (status)
                query.status = status;
            if (gameId)
                query.game_id = gameId;
            const jobs = await IngestionJob_1.IngestionJob.find(query)
                .sort({ created_at: -1 })
                .limit(limit)
                .exec();
            return { success: true, data: jobs };
        }
        catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch jobs' };
        }
    }
    async getAnalyses(limit = 20, offset = 0, gameId, search) {
        try {
            const query = {};
            if (gameId)
                query.game_id = gameId;
            if (search) {
                query.$or = [
                    { analysis_id: { $regex: search, $options: 'i' } },
                    { game_id: { $regex: search, $options: 'i' } },
                    { youtube_url: { $regex: search, $options: 'i' } }
                ];
            }
            const analyses = await Analysis_1.Analysis.find(query)
                .sort({ created_at: -1 })
                .skip(offset)
                .limit(limit)
                .exec();
            return { success: true, data: analyses };
        }
        catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch analyses' };
        }
    }
    async deleteAnalysis(analysisId) {
        try {
            const result = await Analysis_1.Analysis.deleteOne({ analysis_id: analysisId });
            return { success: true, data: result.deletedCount > 0 };
        }
        catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Failed to delete analysis' };
        }
    }
    async retryJob(jobId) {
        try {
            const job = await IngestionJob_1.IngestionJob.findOne({ job_id: jobId });
            if (!job)
                return { success: false, error: 'Job not found' };
            job.status = 'pending';
            job.retry_count = (job.retry_count || 0) + 1;
            job.error_message = undefined;
            await job.save();
            return { success: true, data: true };
        }
        catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Failed to retry job' };
        }
    }
    async triggerManualUrl(gameId, youtubeUrl) {
        try {
            // Check if already exists
            const existing = await IngestionJob_1.IngestionJob.findOne({ youtube_url: youtubeUrl });
            if (existing)
                return { success: false, error: 'Video already in system' };
            const jobId = `manual_${Date.now()}`;
            const newJob = new IngestionJob_1.IngestionJob({
                job_id: jobId,
                game_id: gameId,
                youtube_url: youtubeUrl,
                search_query: 'MANUAL_TRIGGER',
                source: 'manual',
                status: 'pending'
            });
            await newJob.save();
            return { success: true, data: newJob };
        }
        catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Failed to trigger job' };
        }
    }
    async seedUrls(gameId, youtubeUrls) {
        let queued = 0;
        let skipped = 0;
        for (const url of youtubeUrls) {
            try {
                const existing = await IngestionJob_1.IngestionJob.findOne({ youtube_url: url });
                if (existing) {
                    skipped++;
                    continue;
                }
                await new IngestionJob_1.IngestionJob({
                    job_id: `seed_${Date.now()}_${queued}`,
                    game_id: gameId,
                    youtube_url: url,
                    search_query: 'MANUAL_SEED',
                    source: 'manual',
                    status: 'pending',
                    retry_count: 0,
                }).save();
                queued++;
            }
            catch {
                skipped++;
            }
        }
        return { success: true, data: { queued, skipped }, message: `Seeded ${queued} URLs for ${gameId}` };
    }
    async getCharacters(gameId) {
        try {
            const query = gameId ? { game_id: gameId } : {};
            const characters = await Character_1.Character.find(query).sort({ game_id: 1, name: 1 }).lean().exec();
            return { success: true, data: characters };
        }
        catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch characters' };
        }
    }
    async createCharacter(data) {
        try {
            const character = await Character_1.Character.create(data);
            // Automatically initialize encyclopedia for the current patch if game exists
            const game = await Game_1.Game.findOne({ game_id: data.game_id });
            if (game && game.latest_version) {
                const encyclopediaRepo = new CharacterEncyclopediaRepository_1.CharacterEncyclopediaRepository();
                await encyclopediaRepo.createEncyclopedia({
                    game_id: data.game_id,
                    character_id: character.id || character._id.toString(),
                    patch_version: game.latest_version,
                    is_current_patch: true,
                    moveset: { normals: [], specials: [], ex_moves: [], supers: [] },
                    game_rules: [],
                    videos: []
                });
            }
            return { success: true, data: character };
        }
        catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Failed to create character' };
        }
    }
    async updateCharacter(id, data) {
        try {
            const character = await Character_1.Character.findByIdAndUpdate(id, data, { new: true });
            if (!character)
                return { success: false, error: 'Character not found' };
            return { success: true, data: character };
        }
        catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Failed to update character' };
        }
    }
    async deleteCharacter(id) {
        try {
            const result = await Character_1.Character.deleteOne({ _id: id });
            return { success: true, data: result.deletedCount > 0 };
        }
        catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Failed to delete character' };
        }
    }
}
exports.AdminService = AdminService;
//# sourceMappingURL=AdminService.js.map