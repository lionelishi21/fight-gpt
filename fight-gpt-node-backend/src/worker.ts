import dotenv from 'dotenv';
dotenv.config();

import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { Database } from './config/database';
import { Logger } from './helpers/logger';
import { AnalysisService } from './services/AnalysisService';
import { IngestionRepository } from './repositories/IngestionRepository';
import { AnalysisRepository } from './repositories/AnalysisRepository';
import { AiService } from './services/AiService';
import { GameMetadataService } from './services/GameMetadataService';
import { GameMetadataRepository } from './repositories/GameMetadataRepository';
import { CharacterEncyclopediaService } from './services/CharacterEncyclopediaService';
import { CharacterEncyclopediaRepository } from './repositories/CharacterEncyclopediaRepository';
import { CharacterService } from './services/CharacterService';
import { CharacterRepository } from './repositories/CharacterRepository';
import { GameRepository } from './repositories/GameRepository';
import { VectorRepository } from './repositories/VectorRepository';
import { NotificationService } from './services/NotificationService';
import { NotificationRepository } from './repositories/NotificationRepository';
import { RivalRepository } from './repositories/RivalRepository';
import { AnalysisJobData, ProofValidationJobData } from './services/QueueService';
import { GamificationService } from './services/GamificationService';
import Mission from './models/Mission';
import UserMission from './models/UserMission';
import { AppConfig } from './config/app';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

async function runWorker() {
    try {
        Logger.info('Starting MetaPunish Worker Node...');
        
        // 1. Initialize DB
        await Database.connect();
        
        // 2. Initialize Repositories
        const ingestionRepo = new IngestionRepository();
        
        // Cleanup: If the worker just started/restarted, reset any 'processing' jobs back to 'pending'
        // This ensures that if the worker crashed, the jobs don't stay stuck in 'processing' forever.
        const stuckJobs = await ingestionRepo.updateStuckJobs();
        if (stuckJobs > 0) {
            Logger.info(`[Worker] Reset ${stuckJobs} stuck 'processing' jobs back to 'pending'`);
        }
        
        const analysisRepo = new AnalysisRepository();
        const gameMetadataRepo = new GameMetadataRepository();
        const characterEncyclopediaRepo = new CharacterEncyclopediaRepository();
        const characterRepo = new CharacterRepository();
        const gameRepo = new GameRepository();
        const vectorRepo = new VectorRepository();
        const notificationRepo = new NotificationRepository();
        const rivalRepo = new RivalRepository();

        // 3. Initialize Services (Dependency Injection)
        const gameMetadataService = new GameMetadataService(gameMetadataRepo);
        const characterEncyclopediaService = new CharacterEncyclopediaService(characterEncyclopediaRepo);
        const characterService = new CharacterService(characterRepo, gameRepo);
        const notificationService = new NotificationService(notificationRepo);
        
        const aiService = new AiService(
            AppConfig.GEMINI_API_KEY,
            AppConfig.GEMINI_MODEL,
            gameMetadataService,
            characterEncyclopediaService
        );

        const analysisService = new AnalysisService(
            analysisRepo,
            aiService,
            gameMetadataService,
            characterEncyclopediaService,
            characterService,
            vectorRepo,
            notificationService,
            rivalRepo
        );

        // 4. Setup BullMQ Worker
        const connection = new IORedis(REDIS_URL, {
            maxRetriesPerRequest: null,
        });

        const worker = new Worker<AnalysisJobData>(
            'analysis-queue',
            async (job) => {
                const { job_id, youtube_url, game_id, pro_player_id } = job.data;
                
                Logger.info(`[Worker] Processing job ${job_id} (${youtube_url})`);

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
                        } as any);
                        Logger.info(`[Worker] Job ${job_id} completed: ${scenarioCount} scenarios`);
                    } else {
                        throw new Error(result.error || 'Analysis returned no data');
                    }
                } catch (e) {
                    const msg = e instanceof Error ? e.message : 'Unknown error';
                    Logger.error(`[Worker] Job ${job_id} failed: ${msg}`);
                    
                    // The queue handler will handle retries, but we update the DB for status visibility
                    await ingestionRepo.updateJobStatus(job_id, 'pending', {
                        error_message: msg,
                    } as any);
                    
                    throw e; // Rethrow to let BullMQ handle retry
                }
            },
            { 
                connection,
                concurrency: 1, // 1 at a time to respect Gemini RPM limits
                limiter: {
                    max: 5,
                    duration: 60000 // 5 analyses per minute (Gemini 1.5 Flash RPM limit)
                }
            }
        );

        Logger.info('Worker is listening for jobs on "analysis-queue"');

        // Heartbeat — writes a Redis key every 30s so the API can detect this worker
        // is alive without needing Redis 6.2+ getWorkers() support.
        // Key expires in 60s, so if the worker dies the status flips offline within 1 minute.
        const heartbeatConnection = new IORedis(REDIS_URL, { maxRetriesPerRequest: null });
        const HEARTBEAT_KEY = 'metapunish:worker:heartbeat';
        const writeHeartbeat = async () => {
            try {
                await heartbeatConnection.set(HEARTBEAT_KEY, Date.now().toString(), 'EX', 60);
            } catch (e) {
                Logger.warn('[Worker] Heartbeat write failed');
            }
        };
        await writeHeartbeat(); // write immediately on startup
        const heartbeatInterval = setInterval(writeHeartbeat, 30000);


        // 5. Setup Mission Proof Validation Worker
        const proofWorker = new Worker<ProofValidationJobData>(
            'proof-validation-queue',
            async (job) => {
                const { userId, missionId, proofUrl } = job.data;
                Logger.info(`[Worker] Validating proof for User ${userId} - Mission ${missionId}`);

                try {
                    const mission = await Mission.findById(missionId);
                    if (!mission) throw new Error('Mission not found');

                    // AI Validation
                    const validationResult = await aiService.verifyMissionProof(proofUrl, {
                        title: mission.title,
                        description: mission.description,
                        criteria: mission.criteria
                    });

                    const userMission = await UserMission.findOne({ user: userId, mission: missionId });
                    if (!userMission) throw new Error('UserMission entry missing');

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
                        const gamificationService = new GamificationService();
                        await gamificationService.addXp(userId, mission.reward.xp);

                        // 3. Send Notification
                        await notificationService.sendPushToUser(userId, 'MISSION VERIFIED', `Sensei validated your technique! +${mission.reward.xp} XP awarded.`, { type: 'mission_completed', missionId });

                        Logger.info(`[Worker] Mission ${missionId} verified for User ${userId}`);
                    } else {
                        // Mark as failed
                        userMission.status = 'FAILED';
                        userMission.metadata = { 
                            ...userMission.metadata, 
                            ai_feedback: validationResult.feedback 
                        };
                        await userMission.save();

                        await notificationService.sendPushToUser(userId, 'MISSION FAILED', `Sensei review: ${validationResult.feedback}`, { type: 'mission_failed', missionId });

                        Logger.info(`[Worker] Mission ${missionId} rejected for User ${userId}`);
                    }
                } catch (e) {
                    const msg = e instanceof Error ? e.message : 'Unknown error';
                    Logger.error(`[Worker] Proof validation error: ${msg}`);
                    throw e;
                }
            },
            { connection, concurrency: 1 }
        );

        Logger.info('Worker is listening for jobs on "proof-validation-queue"');

        // Graceful shutdown
        process.on('SIGTERM', async () => {
            Logger.info('Worker shutting down...');
            clearInterval(heartbeatInterval);
            await heartbeatConnection.del(HEARTBEAT_KEY); // signal offline immediately
            await worker.close();
            await proofWorker.close();
            await Database.disconnect();
            process.exit(0);

        });

    } catch (e) {
        Logger.error('Worker failed to start', e);
        process.exit(1);
    }
}

runWorker();
