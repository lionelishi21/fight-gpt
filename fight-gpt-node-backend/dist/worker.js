"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const database_1 = require("./config/database");
const logger_1 = require("./helpers/logger");
const AnalysisService_1 = require("./services/AnalysisService");
const IngestionRepository_1 = require("./repositories/IngestionRepository");
const AnalysisRepository_1 = require("./repositories/AnalysisRepository");
const AiService_1 = require("./services/AiService");
const GameMetadataService_1 = require("./services/GameMetadataService");
const GameMetadataRepository_1 = require("./repositories/GameMetadataRepository");
const CharacterEncyclopediaService_1 = require("./services/CharacterEncyclopediaService");
const CharacterEncyclopediaRepository_1 = require("./repositories/CharacterEncyclopediaRepository");
const CharacterService_1 = require("./services/CharacterService");
const CharacterRepository_1 = require("./repositories/CharacterRepository");
const GameRepository_1 = require("./repositories/GameRepository");
const VectorRepository_1 = require("./repositories/VectorRepository");
const NotificationService_1 = require("./services/NotificationService");
const NotificationRepository_1 = require("./repositories/NotificationRepository");
const RivalRepository_1 = require("./repositories/RivalRepository");
const GamificationService_1 = require("./services/GamificationService");
const Mission_1 = __importDefault(require("./models/Mission"));
const UserMission_1 = __importDefault(require("./models/UserMission"));
const app_1 = require("./config/app");
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
async function runWorker() {
    try {
        logger_1.Logger.info('Starting MetaPunish Worker Node...');
        // 1. Initialize DB
        await database_1.Database.connect();
        // 2. Initialize Repositories
        const ingestionRepo = new IngestionRepository_1.IngestionRepository();
        // Cleanup: If the worker just started/restarted, reset any 'processing' jobs back to 'pending'
        // This ensures that if the worker crashed, the jobs don't stay stuck in 'processing' forever.
        const stuckJobs = await ingestionRepo.updateStuckJobs();
        if (stuckJobs > 0) {
            logger_1.Logger.info(`[Worker] Reset ${stuckJobs} stuck 'processing' jobs back to 'pending'`);
        }
        const analysisRepo = new AnalysisRepository_1.AnalysisRepository();
        const gameMetadataRepo = new GameMetadataRepository_1.GameMetadataRepository();
        const characterEncyclopediaRepo = new CharacterEncyclopediaRepository_1.CharacterEncyclopediaRepository();
        const characterRepo = new CharacterRepository_1.CharacterRepository();
        const gameRepo = new GameRepository_1.GameRepository();
        const vectorRepo = new VectorRepository_1.VectorRepository();
        const notificationRepo = new NotificationRepository_1.NotificationRepository();
        const rivalRepo = new RivalRepository_1.RivalRepository();
        // 3. Initialize Services (Dependency Injection)
        const gameMetadataService = new GameMetadataService_1.GameMetadataService(gameMetadataRepo);
        const characterEncyclopediaService = new CharacterEncyclopediaService_1.CharacterEncyclopediaService(characterEncyclopediaRepo);
        const characterService = new CharacterService_1.CharacterService(characterRepo, gameRepo);
        const notificationService = new NotificationService_1.NotificationService(notificationRepo);
        const aiService = new AiService_1.AiService(app_1.AppConfig.GEMINI_API_KEY, app_1.AppConfig.GEMINI_MODEL, gameMetadataService, characterEncyclopediaService);
        const analysisService = new AnalysisService_1.AnalysisService(analysisRepo, aiService, gameMetadataService, characterEncyclopediaService, characterService, vectorRepo, notificationService, rivalRepo);
        // 4. Setup BullMQ Worker
        const connection = new ioredis_1.default(REDIS_URL, {
            maxRetriesPerRequest: null,
        });
        const worker = new bullmq_1.Worker('analysis-queue', async (job) => {
            const { job_id, youtube_url, game_id, pro_player_id } = job.data;
            logger_1.Logger.info(`[Worker] Processing job ${job_id} (${youtube_url})`);
            try {
                // Mark as processing in DB
                await ingestionRepo.updateJobStatus(job_id, 'processing');
                // Run analysis
                const result = await analysisService.analyzeVideo({
                    youtube_url,
                    game_id,
                    pro_player_id
                });
                if (result.success && result.data) {
                    const scenarioCount = result.data.timeline?.length || 0;
                    await ingestionRepo.updateJobStatus(job_id, 'completed', {
                        analysis_id: result.data.analysis_id,
                        scenario_count: scenarioCount,
                        video_title: result.data.game_title,
                    });
                    logger_1.Logger.info(`[Worker] Job ${job_id} completed: ${scenarioCount} scenarios`);
                }
                else {
                    throw new Error(result.error || 'Analysis returned no data');
                }
            }
            catch (e) {
                const msg = e instanceof Error ? e.message : 'Unknown error';
                logger_1.Logger.error(`[Worker] Job ${job_id} failed: ${msg}`);
                // The queue handler will handle retries, but we update the DB for status visibility
                await ingestionRepo.updateJobStatus(job_id, 'pending', {
                    error_message: msg,
                });
                throw e; // Rethrow to let BullMQ handle retry
            }
        }, {
            connection,
            concurrency: 1, // Playwright/Chromium is CPU-intensive — process 1 video at a time
            limiter: {
                max: 5,
                duration: 60000 // 5 analyses per minute (Gemini 1.5 Flash RPM limit)
            }
        });
        logger_1.Logger.info('Worker is listening for jobs on "analysis-queue"');
        // Heartbeat — writes a Redis key every 30s so the API can detect this worker
        // is alive without needing Redis 6.2+ getWorkers() support.
        // Key expires in 60s, so if the worker dies the status flips offline within 1 minute.
        const heartbeatConnection = new ioredis_1.default(REDIS_URL, { maxRetriesPerRequest: null });
        const HEARTBEAT_KEY = 'metapunish:worker:heartbeat';
        const writeHeartbeat = async () => {
            try {
                await heartbeatConnection.set(HEARTBEAT_KEY, Date.now().toString(), 'EX', 60);
            }
            catch (e) {
                logger_1.Logger.warn('[Worker] Heartbeat write failed');
            }
        };
        await writeHeartbeat(); // write immediately on startup
        const heartbeatInterval = setInterval(writeHeartbeat, 30000);
        // 5. Setup Mission Proof Validation Worker
        const proofWorker = new bullmq_1.Worker('proof-validation-queue', async (job) => {
            const { userId, missionId, proofUrl } = job.data;
            logger_1.Logger.info(`[Worker] Validating proof for User ${userId} - Mission ${missionId}`);
            try {
                const mission = await Mission_1.default.findById(missionId);
                if (!mission)
                    throw new Error('Mission not found');
                // AI Validation
                const validationResult = await aiService.verifyMissionProof(proofUrl, {
                    title: mission.title,
                    description: mission.description,
                    criteria: mission.criteria
                });
                const userMission = await UserMission_1.default.findOne({ user: userId, mission: missionId });
                if (!userMission)
                    throw new Error('UserMission entry missing');
                if (validationResult.verified) {
                    // 1. Mark mission as completed
                    userMission.status = 'COMPLETED';
                    userMission.completedAt = new Date();
                    userMission.metadata = {
                        ...userMission.metadata,
                        ai_feedback: validationResult.feedback,
                        technique_score: validationResult.technique_score
                    };
                    await userMission.save();
                    // 2. Award XP
                    const gamificationService = new GamificationService_1.GamificationService();
                    await gamificationService.addXp(userId, mission.reward.xp);
                    // 3. Send Notification
                    await notificationService.sendPushToUser(userId, 'MISSION VERIFIED', `Sensei validated your technique! +${mission.reward.xp} XP awarded.`, { type: 'mission_completed', missionId });
                    logger_1.Logger.info(`[Worker] Mission ${missionId} verified for User ${userId}`);
                }
                else {
                    // Mark as failed
                    userMission.status = 'FAILED';
                    userMission.metadata = {
                        ...userMission.metadata,
                        ai_feedback: validationResult.feedback
                    };
                    await userMission.save();
                    await notificationService.sendPushToUser(userId, 'MISSION FAILED', `Sensei review: ${validationResult.feedback}`, { type: 'mission_failed', missionId });
                    logger_1.Logger.info(`[Worker] Mission ${missionId} rejected for User ${userId}`);
                }
            }
            catch (e) {
                const msg = e instanceof Error ? e.message : 'Unknown error';
                logger_1.Logger.error(`[Worker] Proof validation error: ${msg}`);
                throw e;
            }
        }, { connection, concurrency: 1 });
        logger_1.Logger.info('Worker is listening for jobs on "proof-validation-queue"');
        // Graceful shutdown
        process.on('SIGTERM', async () => {
            logger_1.Logger.info('Worker shutting down...');
            clearInterval(heartbeatInterval);
            await heartbeatConnection.del(HEARTBEAT_KEY); // signal offline immediately
            await worker.close();
            await proofWorker.close();
            await database_1.Database.disconnect();
            process.exit(0);
        });
    }
    catch (e) {
        logger_1.Logger.error('Worker failed to start', e);
        process.exit(1);
    }
}
runWorker();
//# sourceMappingURL=worker.js.map