import { IngestionJob } from '../models/IngestionJob';
import { Analysis } from '../models/Analysis';
import User from '../models/User';
import { Scenario } from '../models/Scenario';
import { Character } from '../models/Character';
import { Game } from '../models/Game';
import { CharacterEncyclopediaRepository } from '../repositories/CharacterEncyclopediaRepository';
import { ApiResponse } from '../types';
import { BaseService } from './BaseService';

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
}

export class AdminService extends BaseService implements IAdminService {
    async getSystemStats(): Promise<ApiResponse<any>> {
        try {
            const startOfToday = new Date();
            startOfToday.setHours(0, 0, 0, 0);

            const [
                totalUsers,
                totalAnalyses,
                totalScenarios,
                pendingJobs,
                failedJobs,
                dailyAnalyses,
                dailyScenarios,
                latestAnalysesToday
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
                .exec();
            
            return { success: true, data: analyses };
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

            return { success: true, data: true };
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Failed to retry job' };
        }
    }

    async triggerManualUrl(gameId: string, youtubeUrl: string): Promise<ApiResponse<any>> {
        try {
            // Check if already exists
            const existing = await IngestionJob.findOne({ youtube_url: youtubeUrl });
            if (existing) return { success: false, error: 'Video already in system' };

            const jobId = `manual_${Date.now()}`;
            const newJob = new IngestionJob({
                job_id: jobId,
                game_id: gameId,
                youtube_url: youtubeUrl,
                search_query: 'MANUAL_TRIGGER',
                source: 'manual',
                status: 'pending'
            });

            await newJob.save();
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
                await new IngestionJob({
                    job_id: `seed_${Date.now()}_${queued}`,
                    game_id: gameId,
                    youtube_url: url,
                    search_query: 'MANUAL_SEED',
                    source: 'manual',
                    status: 'pending',
                    retry_count: 0,
                }).save();
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
