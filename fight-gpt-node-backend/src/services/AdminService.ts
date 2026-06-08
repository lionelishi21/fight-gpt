import { IngestionJob } from '../models/IngestionJob';
import { Analysis } from '../models/Analysis';
import User from '../models/User';
import { Scenario } from '../models/Scenario';
import { Character } from '../models/Character';
import { Game } from '../models/Game';
import { CharacterEncyclopediaRepository } from '../repositories/CharacterEncyclopediaRepository';
import { ApiResponse, AiUsageRecord } from '../types';
import { BaseService } from './BaseService';
import { queueService } from './QueueService';
import { normalizeYoutubeUrl } from '../helpers/youtubeHelper';

// Approximate Gemini per-token pricing (USD/token), used to turn raw token counts
// into an estimated cost. Verify against https://ai.google.dev/pricing if rates
// change — kept in one place so they're easy to update.
const GEMINI_PRICING_PER_TOKEN: Record<string, { input: number; output: number }> = {
    'gemini-2.5-flash': { input: 0.30 / 1_000_000, output: 2.50 / 1_000_000 },
    'gemini-2.5-pro':   { input: 1.25 / 1_000_000, output: 10.00 / 1_000_000 },
};

function estimateCostUsd(records: AiUsageRecord[]): number {
    return records.reduce((sum, r) => {
        const rate = GEMINI_PRICING_PER_TOKEN[r.model] || GEMINI_PRICING_PER_TOKEN['gemini-2.5-flash'];
        return sum + r.prompt_tokens * rate.input + r.candidates_tokens * rate.output;
    }, 0);
}

function summarizeAiUsage(docs: Array<{ ai_usage?: { records: AiUsageRecord[]; total_tokens: number } }>) {
    let totalTokens = 0;
    let estimatedCostUsd = 0;
    const byStage: Record<string, { count: number; total_tokens: number; estimated_cost_usd: number }> = {};

    for (const doc of docs) {
        const records = doc.ai_usage?.records || [];
        if (records.length === 0) continue;

        totalTokens += doc.ai_usage?.total_tokens || records.reduce((s, r) => s + r.total_tokens, 0);
        estimatedCostUsd += estimateCostUsd(records);

        for (const r of records) {
            const bucket = byStage[r.stage] || { count: 0, total_tokens: 0, estimated_cost_usd: 0 };
            bucket.count += 1;
            bucket.total_tokens += r.total_tokens;
            bucket.estimated_cost_usd += estimateCostUsd([r]);
            byStage[r.stage] = bucket;
        }
    }

    return {
        videos_with_usage: docs.filter(d => (d.ai_usage?.records?.length || 0) > 0).length,
        total_tokens: totalTokens,
        estimated_cost_usd: Number(estimatedCostUsd.toFixed(2)),
        by_stage: Object.fromEntries(
            Object.entries(byStage).map(([stage, b]) => [stage, { ...b, estimated_cost_usd: Number(b.estimated_cost_usd.toFixed(2)) }])
        ),
    };
}

export interface IAdminService {
    getSystemStats(): Promise<ApiResponse<any>>;
    getIngestionJobs(limit: number, status?: string, gameId?: string): Promise<ApiResponse<any[]>>;
    getAnalyses(limit: number, offset: number, gameId?: string, search?: string): Promise<ApiResponse<any[]>>;
    deleteAnalysis(analysisId: string): Promise<ApiResponse<boolean>>;
    retryJob(jobId: string): Promise<ApiResponse<boolean>>;
    triggerManualUrl(gameId: string, youtubeUrl: string): Promise<ApiResponse<any>>;
    seedUrls(gameId: string, youtubeUrls: string[]): Promise<ApiResponse<{ queued: number; skipped: number }>>;
    getCharacters(gameId?: string): Promise<ApiResponse<any[]>>;
    createCharacter(data: any): Promise<ApiResponse<any>>;
    updateCharacter(id: string, data: any): Promise<ApiResponse<any>>;
    deleteCharacter(id: string): Promise<ApiResponse<boolean>>;
    reanalyzeAnalysis(
        analysisId: string,
        overrides?: {
            p1_character_id?: string;
            p2_character_id?: string;
            p1_name?: string;
            p2_name?: string;
        }
    ): Promise<ApiResponse<any>>;
}

export class AdminService extends BaseService implements IAdminService {
    constructor() {
        super();
    }

    async reanalyzeAnalysis(
        analysisId: string,
        overrides?: {
            p1_character_id?: string;
            p2_character_id?: string;
            p1_name?: string;
            p2_name?: string;
        }
    ): Promise<ApiResponse<any>> {
        try {
            const analysis = await Analysis.findOne({ analysis_id: analysisId });
            if (!analysis) return { success: false, error: 'Analysis record not found' };

            const youtubeUrl = analysis.youtube_url;
            if (!youtubeUrl) return { success: false, error: 'Analysis lacks a YouTube URL for re-analysis' };

            const gameId = analysis.game_id;

            // Fresh BullMQ-safe job ID every time
            const jobId = `reanalyze_${analysisId}_${Date.now()}`;

            // youtube_url has a unique index — update the existing job record in-place
            // rather than inserting a new one. If no existing job, create one.
            await IngestionJob.findOneAndUpdate(
                { youtube_url: youtubeUrl },
                {
                    $set: {
                        job_id: jobId,
                        game_id: gameId,
                        status: 'pending',
                        source: 'manual',
                        search_query: 'REANALYZE',
                        error_message: undefined,
                    },
                    $inc: { retry_count: 1 },
                },
                { upsert: true, new: true }
            );

            await queueService.addAnalysisJob({
                job_id: jobId,
                game_id: gameId,
                youtube_url: youtubeUrl,
                source: 'user',
            });

            return {
                success: true,
                message: 'Re-analysis queued. The record will be updated shortly.',
                data: { analysis_id: analysisId, url: youtubeUrl, job_id: jobId },
            };
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Failed to trigger re-analysis' };
        }
    }

    async getSystemStats(): Promise<ApiResponse<any>> {
        try {
            const startOfToday = new Date();
            startOfToday.setHours(0, 0, 0, 0);

            const startOfWeek = new Date(startOfToday);
            startOfWeek.setDate(startOfWeek.getDate() - 6);

            const [
                totalUsers,
                totalAnalyses,
                totalScenarios,
                pendingJobs,
                failedJobs,
                dailyAnalyses,
                dailyScenarios,
                latestAnalysesToday,
                isWorkerOnline,
                discoveryStats
            ] = await Promise.all([
                User.countDocuments(),
                Analysis.countDocuments(),
                Scenario.countDocuments(),
                IngestionJob.countDocuments({ status: 'pending' }),
                IngestionJob.countDocuments({ status: 'failed' }),
                Analysis.countDocuments({ created_at: { $gte: startOfToday } }),
                Scenario.countDocuments({ created_at: { $gte: startOfToday } }),
                Analysis.find({ created_at: { $gte: startOfToday } })
                    .sort({ created_at: -1 })
                    .limit(10)
                    .select('analysis_id game_id youtube_url created_at')
                    .lean(),
                queueService.getWorkerStatus(),
                Analysis.aggregate([
                    { $group: { _id: null, views: { $sum: '$view_count' }, clicks: { $sum: '$click_count' } } }
                ])
            ]);

            // AI cost — computed from real Gemini token usage captured per analysis
            // (see AiService.recordUsage / Analysis.ai_usage), not flat per-stage estimates.
            const [todayUsageDocs, weekUsageDocs] = await Promise.all([
                Analysis.find({ created_at: { $gte: startOfToday }, ai_usage: { $exists: true } })
                    .select('ai_usage')
                    .lean(),
                Analysis.find({ created_at: { $gte: startOfWeek }, ai_usage: { $exists: true } })
                    .select('ai_usage')
                    .lean(),
            ]);
            const aiCost = {
                today: summarizeAiUsage(todayUsageDocs as any[]),
                last_7_days: summarizeAiUsage(weekUsageDocs as any[]),
            };

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
                    },
                    worker: {
                        status: isWorkerOnline ? 'online' : 'offline',
                        timestamp: new Date().toISOString()
                    },
                    discovery: {
                        views: (discoveryStats as any)[0]?.views || 0,
                        clicks: (discoveryStats as any)[0]?.clicks || 0
                    },
                    ai_cost: aiCost
                }
            };
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Unknown systems error' };
        }
    }

    async getIngestionJobs(limit: number = 20, status?: string, gameId?: string): Promise<ApiResponse<any[]>> {
        try {
            const query: any = {};
            if (status) query.status = status;
            if (gameId) query.game_id = gameId;

            const jobs = await IngestionJob.find(query)
                .sort({ created_at: -1 })
                .limit(limit)
                .exec();
            
            return { success: true, data: jobs };
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch jobs' };
        }
    }

    async getAnalyses(limit: number = 20, offset: number = 0, gameId?: string, search?: string): Promise<ApiResponse<any[]>> {
        try {
            const query: any = {};
            if (gameId) query.game_id = gameId;
            if (search) {
                query.$or = [
                    { analysis_id: { $regex: search, $options: 'i' } },
                    { game_id: { $regex: search, $options: 'i' } },
                    { youtube_url: { $regex: search, $options: 'i' } }
                ];
            }

            const analyses = await Analysis.find(query)
                .sort({ created_at: -1 })
                .skip(offset)
                .limit(limit)
                .lean()
                .exec();
            
            // Map to ensure top-level analysis_id and consistency with user feed
            const mappedAnalyses = analyses.map(a => ({
                ...a,
                analysis_id: a.analysis_id, // Ensure it's explicitly here
            }));

            return { success: true, data: mappedAnalyses };
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch analyses' };
        }
    }

    async deleteAnalysis(analysisId: string): Promise<ApiResponse<boolean>> {
        try {
            const result = await Analysis.deleteOne({ analysis_id: analysisId });
            return { success: true, data: result.deletedCount > 0 };
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Failed to delete analysis' };
        }
    }

    async retryJob(jobId: string): Promise<ApiResponse<boolean>> {
        try {
            const job = await IngestionJob.findOne({ job_id: jobId });
            if (!job) return { success: false, error: 'Job not found' };

            job.status = 'pending';
            job.retry_count = (job.retry_count || 0) + 1;
            job.error_message = undefined;
            await job.save();

            // PUSH TO QUEUE
            await queueService.addAnalysisJob({
                job_id: job.job_id,
                game_id: job.game_id,
                youtube_url: job.youtube_url,
                video_title: job.video_title
            });

            return { success: true, data: true };
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Failed to retry job' };
        }
    }

    async triggerManualUrl(gameId: string, youtubeUrl: string): Promise<ApiResponse<any>> {
        try {
            const normalizedUrl = normalizeYoutubeUrl(youtubeUrl);

            // Check if already in ingestion pipeline
            const existingJob = await IngestionJob.findOne({ youtube_url: normalizedUrl });
            if (existingJob) return { success: false, error: 'Video is already being processed or in system' };

            // Check if already analyzed
            const existingAnalysis = await Analysis.findOne({ youtube_url: normalizedUrl });
            if (existingAnalysis) return { success: false, error: 'Video has already been analyzed and is in the discovery feed' };

            const jobId = `manual_${Date.now()}`;
            const newJob = new IngestionJob({
                job_id: jobId,
                game_id: gameId,
                youtube_url: normalizedUrl,
                search_query: 'MANUAL_TRIGGER',
                source: 'manual',
                status: 'pending'
            });

            await newJob.save();

            // PUSH TO QUEUE
            await queueService.addAnalysisJob({
                job_id: jobId,
                game_id: gameId,
                youtube_url: normalizedUrl
            });

            return { success: true, data: newJob };
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Failed to trigger job' };
        }
    }

    async seedUrls(gameId: string, youtubeUrls: string[]): Promise<ApiResponse<{ queued: number; skipped: number }>> {
        let queued = 0;
        let skipped = 0;
        for (const url of youtubeUrls) {
            try {
                const existing = await IngestionJob.findOne({ youtube_url: url });
                if (existing) { skipped++; continue; }
                const newJob = new IngestionJob({
                    job_id: `seed_${Date.now()}_${queued}`,
                    game_id: gameId,
                    youtube_url: url,
                    search_query: 'MANUAL_SEED',
                    source: 'manual',
                    status: 'pending',
                    retry_count: 0,
                });
                await newJob.save();

                // PUSH TO QUEUE
                await queueService.addAnalysisJob({
                    job_id: newJob.job_id,
                    game_id: gameId,
                    youtube_url: url
                });

                queued++;
            } catch {
                skipped++;
            }
        }
        return { success: true, data: { queued, skipped }, message: `Seeded ${queued} URLs for ${gameId}` };
    }

    async getCharacters(gameId?: string): Promise<ApiResponse<any[]>> {
        try {
            const query = gameId ? { game_id: gameId } : {};
            const characters = await Character.find(query).sort({ game_id: 1, name: 1 }).lean().exec();
            return { success: true, data: characters };
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch characters' };
        }
    }

    async createCharacter(data: any): Promise<ApiResponse<any>> {
        try {
            const character = await Character.create(data);
            
            // Automatically initialize encyclopedia for the current patch if game exists
            const game = await Game.findOne({ game_id: data.game_id });
            if (game && game.latest_version) {
                const encyclopediaRepo = new CharacterEncyclopediaRepository();
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
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Failed to create character' };
        }
    }

    async updateCharacter(id: string, data: any): Promise<ApiResponse<any>> {
        try {
            const character = await Character.findByIdAndUpdate(id, data, { new: true });
            if (!character) return { success: false, error: 'Character not found' };
            return { success: true, data: character };
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Failed to update character' };
        }
    }

    async deleteCharacter(id: string): Promise<ApiResponse<boolean>> {
        try {
            const result = await Character.deleteOne({ _id: id });
            return { success: true, data: result.deletedCount > 0 };
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Failed to delete character' };
        }
    }
}
