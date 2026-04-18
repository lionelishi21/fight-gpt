import { IngestionJob } from '../models/IngestionJob';
import { Analysis } from '../models/Analysis';
import User from '../models/User';
import { Scenario } from '../models/Scenario';
import { ApiResponse } from '../types';
import { BaseService } from './BaseService';

export interface IAdminService {
    getSystemStats(): Promise<ApiResponse<any>>;
    getIngestionJobs(limit: number, status?: string): Promise<ApiResponse<any[]>>;
    getAnalyses(limit: number, offset: number): Promise<ApiResponse<any[]>>;
    deleteAnalysis(analysisId: string): Promise<ApiResponse<boolean>>;
    retryJob(jobId: string): Promise<ApiResponse<boolean>>;
    triggerManualUrl(gameId: string, youtubeUrl: string): Promise<ApiResponse<any>>;
    seedUrls(gameId: string, youtubeUrls: string[]): Promise<ApiResponse<{ queued: number; skipped: number }>>;
}

export class AdminService extends BaseService implements IAdminService {
    async getSystemStats(): Promise<ApiResponse<any>> {
        try {
            const [
                totalUsers,
                totalAnalyses,
                totalScenarios,
                pendingJobs,
                failedJobs
            ] = await Promise.all([
                User.countDocuments(),
                Analysis.countDocuments(),
                Scenario.countDocuments(),
                IngestionJob.countDocuments({ status: 'pending' }),
                IngestionJob.countDocuments({ status: 'failed' })
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
                    }
                }
            };
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Unknown systems error' };
        }
    }

    async getIngestionJobs(limit: number = 20, status?: string): Promise<ApiResponse<any[]>> {
        try {
            const query = status ? { status } : {};
            const jobs = await IngestionJob.find(query)
                .sort({ created_at: -1 })
                .limit(limit)
                .exec();
            
            return { success: true, data: jobs };
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch jobs' };
        }
    }

    async getAnalyses(limit: number = 20, offset: number = 0): Promise<ApiResponse<any[]>> {
        try {
            const analyses = await Analysis.find()
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
}
