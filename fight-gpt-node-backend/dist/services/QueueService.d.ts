import { Queue } from 'bullmq';
export interface AnalysisJobData {
    youtube_url: string;
    game_id: string;
    job_id: string;
    pro_player_id?: string;
}
export interface ProofValidationJobData {
    userId: string;
    missionId: string;
    proofUrl: string;
}
export declare class QueueService {
    private static instance;
    private analysisQueue;
    private proofValidationQueue;
    private constructor();
    static getInstance(): QueueService;
    /**
     * Add a video for analysis
     */
    addAnalysisJob(data: AnalysisJobData): Promise<void>;
    /**
     * Add a mission proof for validation
     */
    addProofValidationJob(data: ProofValidationJobData): Promise<void>;
    getAnalysisQueue(): Queue<AnalysisJobData>;
    /**
     * Check if the worker process is alive by reading its heartbeat key from Redis.
     * The worker writes 'metapunish:worker:heartbeat' every 30s with a 60s TTL.
     * This approach works on any Redis version (no 6.2+ requirement).
     * Returns true if the key exists (worker alive), false if expired or missing.
     */
    getWorkerStatus(): Promise<boolean>;
}
export declare const queueService: QueueService;
//# sourceMappingURL=QueueService.d.ts.map