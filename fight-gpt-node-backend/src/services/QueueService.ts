import { Queue, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';
import { Logger } from '../helpers/logger';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const connection = new IORedis(REDIS_URL, {
    maxRetriesPerRequest: null,
});

export interface AnalysisJobData {
    youtube_url: string;
    game_id: string;
    job_id: string;
    pro_player_id?: string;
    video_title?: string;
}

export interface ProofValidationJobData {
    userId: string;
    missionId: string;
    proofUrl: string;
}

export class QueueService {
    private static instance: QueueService;
    private analysisQueue: Queue<AnalysisJobData>;
    private proofValidationQueue: Queue<ProofValidationJobData>;

    private constructor() {
        this.analysisQueue = new Queue('analysis-queue', { connection });
        this.proofValidationQueue = new Queue('proof-validation-queue', { connection });
        
        const queueEvents = new QueueEvents('analysis-queue', { connection });
        const proofEvents = new QueueEvents('proof-validation-queue', { connection });
        
        queueEvents.on('completed', ({ jobId }) => {
            Logger.info(`[QueueService] Job ${jobId} completed`);
        });

        queueEvents.on('failed', ({ jobId, failedReason }) => {
            Logger.error(`[QueueService] Job ${jobId} failed: ${failedReason}`);
        });
    }

    public static getInstance(): QueueService {
        if (!QueueService.instance) {
            QueueService.instance = new QueueService();
        }
        return QueueService.instance;
    }

    /**
     * Add a video for analysis
     */
    public async addAnalysisJob(data: AnalysisJobData): Promise<void> {
        await this.analysisQueue.add('analyze-video', data, {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 60000, // Wait 1 min before retry (e.g. for rate limits)
            },
            removeOnComplete: true,
        });
        Logger.info(`[QueueService] Analysis job added for: ${data.youtube_url}`);
    }

    /**
     * Add a mission proof for validation
     */
    public async addProofValidationJob(data: ProofValidationJobData): Promise<void> {
        await this.proofValidationQueue.add('validate-proof', data, {
            attempts: 2,
            backoff: {
                type: 'exponential',
                delay: 30000,
            },
            removeOnComplete: true,
        });
        Logger.info(`[QueueService] Proof validation job added for User ${data.userId} on Mission ${data.missionId}`);
    }

    public getAnalysisQueue(): Queue<AnalysisJobData> {
        return this.analysisQueue;
    }

    /**
     * Check if the worker process is alive by reading its heartbeat key from Redis.
     * The worker writes 'metapunish:worker:heartbeat' every 30s with a 60s TTL.
     * This approach works on any Redis version (no 6.2+ requirement).
     * Returns true if the key exists (worker alive), false if expired or missing.
     */
    public async getWorkerStatus(): Promise<boolean> {
        try {
            const val = await connection.get('metapunish:worker:heartbeat');
            return val !== null;
        } catch (error) {
            Logger.error(`[QueueService] Failed to read worker heartbeat: ${error}`);
            return false;
        }
    }
}

export const queueService = QueueService.getInstance();
