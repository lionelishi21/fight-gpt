"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.queueService = exports.QueueService = void 0;
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const logger_1 = require("../helpers/logger");
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const connection = new ioredis_1.default(REDIS_URL, {
    maxRetriesPerRequest: null,
});
class QueueService {
    static instance;
    analysisQueue;
    proofValidationQueue;
    constructor() {
        this.analysisQueue = new bullmq_1.Queue('analysis-queue', { connection });
        this.proofValidationQueue = new bullmq_1.Queue('proof-validation-queue', { connection });
        const queueEvents = new bullmq_1.QueueEvents('analysis-queue', { connection });
        const proofEvents = new bullmq_1.QueueEvents('proof-validation-queue', { connection });
        queueEvents.on('completed', ({ jobId }) => {
            logger_1.Logger.info(`[QueueService] Job ${jobId} completed`);
        });
        queueEvents.on('failed', ({ jobId, failedReason }) => {
            logger_1.Logger.error(`[QueueService] Job ${jobId} failed: ${failedReason}`);
        });
    }
    static getInstance() {
        if (!QueueService.instance) {
            QueueService.instance = new QueueService();
        }
        return QueueService.instance;
    }
    /**
     * Add a video for analysis
     */
    async addAnalysisJob(data) {
        await this.analysisQueue.add('analyze-video', data, {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 60000, // Wait 1 min before retry (e.g. for rate limits)
            },
            removeOnComplete: true,
        });
        logger_1.Logger.info(`[QueueService] Analysis job added for: ${data.youtube_url}`);
    }
    /**
     * Add a mission proof for validation
     */
    async addProofValidationJob(data) {
        await this.proofValidationQueue.add('validate-proof', data, {
            attempts: 2,
            backoff: {
                type: 'exponential',
                delay: 30000,
            },
            removeOnComplete: true,
        });
        logger_1.Logger.info(`[QueueService] Proof validation job added for User ${data.userId} on Mission ${data.missionId}`);
    }
    getAnalysisQueue() {
        return this.analysisQueue;
    }
    /**
     * Check if the worker process is alive by reading its heartbeat key from Redis.
     * The worker writes 'metapunish:worker:heartbeat' every 30s with a 60s TTL.
     * This approach works on any Redis version (no 6.2+ requirement).
     * Returns true if the key exists (worker alive), false if expired or missing.
     */
    async getWorkerStatus() {
        try {
            const val = await connection.get('metapunish:worker:heartbeat');
            return val !== null;
        }
        catch (error) {
            logger_1.Logger.error(`[QueueService] Failed to read worker heartbeat: ${error}`);
            return false;
        }
    }
}
exports.QueueService = QueueService;
exports.queueService = QueueService.getInstance();
//# sourceMappingURL=QueueService.js.map