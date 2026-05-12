import { BaseRepository } from './BaseRepository';
import { IIngestionJobDocument, IngestionJobStatus } from '../models/IngestionJob';
export interface IIngestionRepository {
    createJob(data: Partial<IIngestionJobDocument>): Promise<IIngestionJobDocument>;
    findByUrl(youtubeUrl: string): Promise<IIngestionJobDocument | null>;
    getPendingJobs(gameId?: string, limit?: number): Promise<IIngestionJobDocument[]>;
    updateJobStatus(jobId: string, status: IngestionJobStatus, extra?: Partial<IIngestionJobDocument>): Promise<IIngestionJobDocument | null>;
    getJobStats(gameId: string): Promise<{
        total: number;
        completed: number;
        failed: number;
        pending: number;
    }>;
    getRecentJobs(gameId: string, limit?: number): Promise<IIngestionJobDocument[]>;
    updateStuckJobs(): Promise<number>;
}
export declare class IngestionRepository extends BaseRepository<IIngestionJobDocument> implements IIngestionRepository {
    constructor();
    createJob(data: Partial<IIngestionJobDocument>): Promise<IIngestionJobDocument>;
    findByUrl(youtubeUrl: string): Promise<IIngestionJobDocument | null>;
    getPendingJobs(gameId?: string, limit?: number): Promise<IIngestionJobDocument[]>;
    updateJobStatus(jobId: string, status: IngestionJobStatus, extra?: Partial<IIngestionJobDocument>): Promise<IIngestionJobDocument | null>;
    getJobStats(gameId: string): Promise<{
        total: number;
        completed: number;
        failed: number;
        pending: number;
    }>;
    getRecentJobs(gameId: string, limit?: number): Promise<IIngestionJobDocument[]>;
    updateStuckJobs(): Promise<number>;
}
//# sourceMappingURL=IngestionRepository.d.ts.map