import dotenv from 'dotenv';
dotenv.config();

// Sentry must init before any other imports so it can instrument them — this is a
// separate process from index.ts's API server, so it needs its own initialization.
import { initSentry } from './helpers/sentry';
initSentry();

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
import { PlayerTendencyRepository } from './repositories/PlayerTendencyRepository';
import { NotificationService } from './services/NotificationService';
import { NotificationRepository } from './repositories/NotificationRepository';
import { RivalRepository } from './repositories/RivalRepository';
import { MetaRepository } from './repositories/MetaRepository';
import { queueService, AnalysisJobData, ProofValidationJobData } from './services/QueueService';
import { GeminiCreditExhaustedError } from './errors';
import Mission from './models/Mission';
import UserMission from './models/UserMission';
import { AppConfig } from './config/app';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Storage } from '@google-cloud/storage';

const execAsync = promisify(exec);
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

/**
 * Downloads the first 20 minutes of a Twitch VOD using streamlink + ffmpeg,
 * uploads to GCS, and returns the GCS URI for Gemini.
 * Returns null if streamlink/ffmpeg are unavailable or download fails.
 */
async function downloadTwitchVod(vodUrl: string, jobId: string): Promise<string | null> {
    const bucket = AppConfig.GOOGLE_STORAGE_BUCKET;
    if (!bucket) {
        Logger.warn('[Worker] GOOGLE_STORAGE_BUCKET not set — cannot upload Twitch VOD');
        return null;
    }

    const tmpFile = path.join(os.tmpdir(), `twitch_${jobId}.mp4`);
    const gcsPath = `twitch-vods/${jobId}.mp4`;

    try {
        // Step 1: resolve HLS stream URL via streamlink
        Logger.info(`[Worker] Resolving Twitch HLS URL for ${vodUrl}`);
        const { stdout: hlsUrl } = await execAsync(
            `streamlink --stream-url "${vodUrl}" 720p,480p,360p,best`,
            { timeout: 30_000 }
        );

        // Step 2: download first 20 minutes via ffmpeg
        Logger.info(`[Worker] Downloading first 20 min of Twitch VOD`);
        await execAsync(
            `ffmpeg -y -i "${hlsUrl.trim()}" -t 1200 -c copy "${tmpFile}"`,
            { timeout: 300_000 }
        );

        // Step 3: upload to GCS
        Logger.info(`[Worker] Uploading Twitch segment to GCS`);
        const storage = new Storage({ projectId: AppConfig.GOOGLE_CLOUD_PROJECT });
        await storage.bucket(bucket).upload(tmpFile, {
            destination: gcsPath,
            metadata: { contentType: 'video/mp4' },
        });

        return `gs://${bucket}/${gcsPath}`;
    } catch (err: any) {
        Logger.error(`[Worker] Twitch VOD download/upload failed: ${err.message}`);
        return null;
    } finally {
        try { if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile); } catch {}
    }
}

async function runWorker() {
    try {
        Logger.info('Starting MetaPunish Worker Node...');

        // LangSmith checks LANGSMITH_* first, then LANGCHAIN_* as fallback
        const tracingEnabled =
            process.env.LANGSMITH_TRACING === 'true' ||
            process.env.LANGSMITH_TRACING_V2 === 'true' ||
            process.env.LANGCHAIN_TRACING_V2 === 'true';
        const hasApiKey =
            !!process.env.LANGSMITH_API_KEY ||
            !!process.env.LANGCHAIN_API_KEY;
        const project =
            process.env.LANGSMITH_PROJECT ||
            process.env.LANGCHAIN_PROJECT ||
            'default';
        const endpoint =
            process.env.LANGSMITH_ENDPOINT ||
            'https://api.smith.langchain.com';

        if (tracingEnabled && hasApiKey) {
            Logger.info(`[LangSmith] Tracing ENABLED → project: ${project} | endpoint: ${endpoint}`);
        } else {
            Logger.warn(`[LangSmith] Tracing DISABLED — tracing=${tracingEnabled}, apiKey=${hasApiKey ? 'set' : 'MISSING'}, endpoint=${endpoint}`);
        }

        // 1. Initialize DB
        await Database.connect();

        // Auto-resume queue on worker startup to resolve past circuit-breaker pauses
        await queueService.resumeQueue().catch(err => Logger.error('Failed to resume queue on startup', err));
        
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
        const playerTendencyRepo = new PlayerTendencyRepository();

        // 3. Initialize Services (Dependency Injection)
        const gameMetadataService = new GameMetadataService(gameMetadataRepo);
        const characterEncyclopediaService = new CharacterEncyclopediaService(characterEncyclopediaRepo);
        const characterService = new CharacterService(characterRepo, gameRepo);
        const notificationService = new NotificationService(notificationRepo);

        const aiService = new AiService(
            AppConfig.GEMINI_API_KEY,
            AppConfig.GEMINI_MODEL,
            gameMetadataService,
            characterEncyclopediaService,
            vectorRepo,
            playerTendencyRepo
        );

        const analysisService = new AnalysisService(
            analysisRepo,
            aiService,
            gameMetadataService,
            characterEncyclopediaService,
            characterService,
            vectorRepo,
            notificationService,
            rivalRepo,
            undefined,
            playerTendencyRepo,
            new MetaRepository()
        );

        // 4. Setup BullMQ Worker
        const connection = new IORedis(REDIS_URL, {
            maxRetriesPerRequest: null,
        });

        const worker = new Worker<AnalysisJobData>(
            'analysis-queue',
            async (job) => {
                const {
                    job_id, youtube_url, game_id, pro_player_id,
                    video_title, video_platform,
                    p1_name, p2_name, p1_character_id, p2_character_id, tournament_name,
                    force,
                } = job.data;

                Logger.info(`[Worker] Processing job ${job_id} [${video_platform || 'youtube'}] (${youtube_url})`);

                try {
                    // Mark as processing in DB
                    await ingestionRepo.updateJobStatus(job_id, 'processing');

                    // For Twitch VODs: download HLS segment → upload to GCS → pass GCS URI
                    // For YouTube: pass URL directly to Gemini (native support)
                    let resolvedUrl = youtube_url;
                    let gcsUploadPath: string | null = null;
                    if (video_platform === 'twitch' || youtube_url.includes('twitch.tv')) {
                        const download = await downloadTwitchVod(youtube_url, job_id);
                        if (download) {
                            resolvedUrl = download; // GCS URI
                            gcsUploadPath = download;
                        } else {
                            Logger.warn(`[Worker] Twitch download failed for ${youtube_url}, skipping`);
                            await ingestionRepo.updateJobStatus(job_id, 'skipped', { error_message: 'Twitch download failed' } as any);
                            return;
                        }
                    }

                    // Build enriched title so AI has tournament context even if it can't read the video title
                    let enrichedTitle = video_title || '';
                    if (tournament_name && !enrichedTitle.includes(tournament_name)) {
                        enrichedTitle = `${tournament_name} — ${enrichedTitle}`.trim().replace(/^—\s/, '');
                    }

                    // Run analysis — pre-labels from start.gg bypass AI character guessing
                    const result = await analysisService.analyzeVideo({
                        youtube_url: resolvedUrl,
                        game_id,
                        pro_player_id,
                        video_title: enrichedTitle || undefined,
                        p1_name,
                        p2_name,
                        p1_character_id,
                        p2_character_id,
                        force: force || false,
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

                    if (e instanceof GeminiCreditExhaustedError) {
                        // Credit exhaustion won't resolve on retry — mark failed immediately
                        // so the job doesn't burn retry slots and the admin can see the real reason.
                        await ingestionRepo.updateJobStatus(job_id, 'failed', {
                            error_message: `CREDIT_EXHAUSTED: ${msg}`,
                        } as any);

                        // Without this, quota exhaustion was logged and silently looped through
                        // every remaining job until someone happened to check logs manually.
                        const { Sentry } = require('./helpers/sentry');
                        Sentry.captureException(e, { level: 'critical', tags: { type: 'gemini_quota_exhausted' } });
                        await queueService.pauseQueue().catch(err => Logger.error('[Worker] Failed to auto-pause queue on quota exhaustion', err));
                        Logger.warn('[Worker] Queue auto-paused — Gemini quota exhausted. Resume manually once billing/quota is resolved.');

                        throw e;
                    }

                    // The queue handler will handle retries, but we update the DB for status visibility
                    await ingestionRepo.updateJobStatus(job_id, 'pending', {
                        error_message: msg,
                    } as any);

                    throw e; // Rethrow to let BullMQ handle retry
                }
            },
            { 
                connection,
                concurrency: 1,
                limiter: {
                    max: 1,
                    duration: 30000, // 1 job per 30s = 2/min → ~6 Gemini calls/min, safely under 15 RPM Flash limit
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
                        userMission.metadata = { ...userMission.metadata, xpAwarded: mission.reward.xp };

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

        // If all BullMQ retries are exhausted, flip the mission to FAILED so it never
        // stays PENDING forever and notify the user.
        proofWorker.on('failed', async (job, err) => {
            if (!job) return;
            const { userId, missionId } = job.data;
            try {
                const userMission = await UserMission.findOne({ user: userId, mission: missionId });
                if (userMission && userMission.status === 'PENDING') {
                    userMission.status = 'FAILED';
                    userMission.metadata = {
                        ...userMission.metadata,
                        ai_feedback: 'Verification could not be completed. Please re-submit your proof.',
                    };
                    await userMission.save();
                    await notificationService.sendPushToUser(
                        userId,
                        'MISSION VERIFICATION FAILED',
                        'We were unable to verify your submission. Please try again.',
                        { type: 'mission_failed', missionId }
                    );
                    Logger.warn(`[Worker] Mission ${missionId} marked FAILED after all retries exhausted for User ${userId}`);
                }
            } catch (e) {
                Logger.error(`[Worker] Failed-handler error for mission ${missionId}: ${e instanceof Error ? e.message : e}`);
            }
        });

        // Without these, an async crash in BullMQ internals or a stray promise
        // bypasses Sentry entirely and PM2 sees a hang instead of a clean restart.
        process.on('unhandledRejection', (reason) => {
            Logger.error('[Worker] Unhandled promise rejection', reason as any);
            const { Sentry } = require('./helpers/sentry');
            Sentry.captureException(reason, { level: 'fatal', tags: { type: 'unhandledRejection', process: 'worker' } });
            process.exit(1);
        });

        process.on('uncaughtException', (error) => {
            Logger.error('[Worker] Uncaught exception', error);
            const { Sentry } = require('./helpers/sentry');
            Sentry.captureException(error, { level: 'fatal', tags: { type: 'uncaughtException', process: 'worker' } });
            process.exit(1);
        });

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
