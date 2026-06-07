import { BaseRepository } from './BaseRepository';
import { IIngestionJobDocument, IngestionJob, IngestionJobStatus } from '../models/IngestionJob';

export interface IIngestionRepository {
    createJob(data: Partial<IIngestionJobDocument>): Promise<IIngestionJobDocument>;
    findByUrl(youtubeUrl: string): Promise<IIngestionJobDocument | null>;
    getPendingJobs(gameId?: string, limit?: number): Promise<IIngestionJobDocument[]>;
    updateJobStatus(jobId: string, status: IngestionJobStatus, extra?: Partial<IIngestionJobDocument>): Promise<IIngestionJobDocument | null>;
    getJobStats(gameId: string): Promise<{ total: number; completed: number; failed: number; pending: number }>;
    getRecentJobs(gameId: string, limit?: number): Promise<IIngestionJobDocument[]>;
    updateStuckJobs(): Promise<number>;
}

export class IngestionRepository extends BaseRepository<IIngestionJobDocument> implements IIngestionRepository {
    constructor() {
        super(IngestionJob);
    }

    async createJob(data: Partial<IIngestionJobDocument>): Promise<IIngestionJobDocument> {
        return this.model.create(data);
    }

    async findByUrl(youtubeUrl: string): Promise<IIngestionJobDocument | null> {
        return this.model.findOne({ youtube_url: youtubeUrl }).exec();
    }

    async getPendingJobs(gameId?: string, limit: number = 10): Promise<IIngestionJobDocument[]> {
        const filter: Record<string, unknown> = { status: 'pending' };
        if (gameId) filter.game_id = gameId;
        return this.model
            .find(filter)
            .sort({ created_at: 1 }) // oldest first (FIFO)
            .limit(limit)
            .exec();
    }

    async updateJobStatus(
        jobId: string,
        status: IngestionJobStatus,
        extra?: Partial<IIngestionJobDocument>
    ): Promise<IIngestionJobDocument | null> {
        const update: Record<string, any> = { status, ...extra };
        if (status === 'completed' || status === 'failed') {
            update.processed_at = new Date();
        }

        let mongoUpdate: any = { $set: update };
        if (status === 'completed') {
            mongoUpdate.$unset = { error_message: 1 };
        }

        return this.model
            .findOneAndUpdate({ job_id: jobId }, mongoUpdate, { new: true })
            .exec();
    }

    async getJobStats(gameId: string): Promise<{ total: number; completed: number; failed: number; pending: number }> {
        const [total, completed, failed, pending] = await Promise.all([
            this.model.countDocuments({ game_id: gameId }),
            this.model.countDocuments({ game_id: gameId, status: 'completed' }),
            this.model.countDocuments({ game_id: gameId, status: 'failed' }),
            this.model.countDocuments({ game_id: gameId, status: 'pending' }),
        ]);
        return { total, completed, failed, pending };
    }

    async getRecentJobs(gameId: string, limit: number = 20): Promise<IIngestionJobDocument[]> {
        return this.model
            .find({ game_id: gameId })
            .sort({ created_at: -1 })
            .limit(limit)
            .exec();
    }

    async updateStuckJobs(): Promise<number> {
        const result = await this.model.updateMany(
            { status: 'processing' },
            { $set: { status: 'pending' } }
        ).exec();
        return result.modifiedCount;
    }
}
