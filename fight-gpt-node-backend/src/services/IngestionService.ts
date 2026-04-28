import { exec } from 'child_process';
import { promisify } from 'util';
import { BaseService } from './BaseService';
import { IIngestionRepository } from '../repositories/IngestionRepository';
import { IAnalysisService } from './AnalysisService';
import { ApiResponse } from '../types';
import { UuidHelper } from '../helpers/uuidHelper';
import { Logger } from '../helpers/logger';

const execAsync = promisify(exec);

// Search queries per game — these surface tournament sets, pro player footage, high-level ranked
const GAME_SEARCH_QUERIES: Record<string, string[]> = {
    sf6: [
        'Street Fighter 6 tournament 2024 top 8',
        'SF6 EVO 2024 grand finals',
        'Street Fighter 6 pro player ranked match',
        'SF6 high level gameplay 2024',
        'Street Fighter 6 combo guide punish',
    ],
    tekken8: [
        'Tekken 8 tournament 2024',
        'Tekken 8 EVO 2024 top 8',
        'Tekken 8 pro player ranked high level',
        'Tekken 8 frame data punish guide',
    ],
    ggst: [
        'Guilty Gear Strive tournament 2024',
        'GGST EVO 2024 grand finals',
        'Guilty Gear Strive high level ranked',
        'Strive combo guide optimal punish',
    ],
    mk1: [
        'Mortal Kombat 1 tournament 2024',
        'MK1 EVO 2024 top 8',
        'Mortal Kombat 1 high level gameplay',
    ],
    dbfz: [
        'Dragon Ball FighterZ tournament 2024',
        'DBFZ EVO 2024 high level',
        'Dragon Ball FighterZ combo guide',
    ],
};

// Default fallback queries for any game not in the list
const DEFAULT_QUERIES = (gameId: string) => [
    `${gameId} fighting game tournament 2024`,
    `${gameId} high level gameplay EVO`,
    `${gameId} pro player ranked match`,
];

export interface IngestionTriggerResult {
    game_id: string;
    queued_count: number;
    skipped_count: number;
    errors: string[];
}

export interface IIngestionService {
    triggerIngestion(gameId: string, maxVideos?: number): Promise<ApiResponse<IngestionTriggerResult>>;
    processQueue(gameId?: string, batchSize?: number): Promise<ApiResponse<{ processed: number; failed: number }>>;
    startScheduler(intervalMs?: number): void;
    stopScheduler(): void;
}

export class IngestionService extends BaseService implements IIngestionService {
    private schedulerTimer: NodeJS.Timeout | null = null;
    private isProcessing = false;

    constructor(
        private readonly ingestionRepository: IIngestionRepository,
        private readonly analysisService: IAnalysisService,
    ) {
        super();
    }

    /**
     * Search YouTube for fighting game videos and queue them for analysis
     */
    async triggerIngestion(
        gameId: string,
        maxVideos: number = 15
    ): Promise<ApiResponse<IngestionTriggerResult>> {
        const queries = GAME_SEARCH_QUERIES[gameId] || DEFAULT_QUERIES(gameId);
        const result: IngestionTriggerResult = {
            game_id: gameId,
            queued_count: 0,
            skipped_count: 0,
            errors: [],
        };

        for (const query of queries) {
            try {
                const videoUrls = await this.searchYouTube(query, Math.ceil(maxVideos / queries.length));

                for (const url of videoUrls) {
                    try {
                        // Skip if already ingested
                        const existing = await this.ingestionRepository.findByUrl(url);
                        if (existing) {
                            result.skipped_count++;
                            continue;
                        }

                        await this.ingestionRepository.createJob({
                            job_id: UuidHelper.generate(),
                            game_id: gameId,
                            youtube_url: url,
                            search_query: query,
                            source: 'scheduled',
                            status: 'pending',
                            retry_count: 0,
                        });
                        result.queued_count++;
                    } catch (e) {
                        // Likely duplicate URL index violation — skip silently
                        result.skipped_count++;
                    }
                }
            } catch (e) {
                const msg = e instanceof Error ? e.message : 'Search failed';
                result.errors.push(`Query "${query}": ${msg}`);
                Logger.warn(`[IngestionService] Search failed for query: ${query}`, e);
            }
        }

        Logger.info(`[IngestionService] Ingestion triggered for ${gameId}: ${result.queued_count} queued, ${result.skipped_count} skipped`);

        return {
            success: true,
            data: result,
            message: `Queued ${result.queued_count} new videos for ${gameId}`,
        };
    }

    /**
     * Process pending ingestion jobs — runs analysis on each queued video
     */
    async processQueue(
        gameId?: string,
        batchSize: number = 10
    ): Promise<ApiResponse<{ processed: number; failed: number }>> {
        if (this.isProcessing) {
            return { success: false, error: 'Queue processor already running' };
        }

        this.isProcessing = true;
        let processed = 0;
        let failed = 0;

        try {
            const jobs = await this.ingestionRepository.getPendingJobs(gameId, batchSize);
            Logger.info(`[IngestionService] Processing ${jobs.length} pending jobs`);

            const processingPromises = jobs.map(async (job) => {
                try {
                    // Mark as processing
                    await this.ingestionRepository.updateJobStatus(job.job_id, 'processing');

                    // Run the analysis pipeline
                    const proPlayerId = (job as any).metadata?.pro_player_id;
                    const analysisResult = await this.analysisService.analyzeVideo({
                        youtube_url: job.youtube_url,
                        game_id: job.game_id,
                        pro_player_id: proPlayerId,
                    });

                    if (analysisResult.success && analysisResult.data) {
                        const scenarioCount = analysisResult.data.timeline?.length || 0;
                        await this.ingestionRepository.updateJobStatus(job.job_id, 'completed', {
                            analysis_id: analysisResult.data.analysis_id,
                            scenario_count: scenarioCount,
                            video_title: analysisResult.data.game_title,
                        } as any);
                        processed++;
                        Logger.info(`[IngestionService] Completed job ${job.job_id} — ${scenarioCount} scenarios extracted`);
                    } else {
                        throw new Error(analysisResult.error || 'Analysis returned no data');
                    }
                } catch (e) {
                    const msg = e instanceof Error ? e.message : 'Unknown error';
                    const shouldRetry = job.retry_count < 2;

                    await this.ingestionRepository.updateJobStatus(
                        job.job_id,
                        shouldRetry ? 'pending' : 'failed',
                        {
                            error_message: msg,
                            retry_count: job.retry_count + 1,
                        } as any
                    );
                    failed++;
                    Logger.warn(`[IngestionService] Job ${job.job_id} failed (retry ${job.retry_count + 1}): ${msg}`);
                }
            });

            await Promise.allSettled(processingPromises);

            return {
                success: true,
                data: { processed, failed },
                message: `Queue processed: ${processed} completed, ${failed} failed`,
            };
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Start background scheduler that triggers ingestion + processing on an interval
     * Default: every 1 hour
     */
    startScheduler(intervalMs: number = 1 * 60 * 60 * 1000): void {
        if (this.schedulerTimer) {
            Logger.warn('[IngestionService] Scheduler already running');
            return;
        }

        Logger.info(`[IngestionService] Starting ingestion scheduler (every ${intervalMs / 3600000}h)`);

        this.schedulerTimer = setInterval(async () => {
            // 1. Regular search-based ingestion
            const gameIds = Object.keys(GAME_SEARCH_QUERIES);
            gameIds.sort((a, b) => (a === 'sf6' ? -1 : b === 'sf6' ? 1 : 0));

            for (const gameId of gameIds) {
                try {
                    const maxVideosToFetch = gameId === 'sf6' ? 20 : 10;
                    await this.triggerIngestion(gameId, maxVideosToFetch);
                } catch (e) {
                    Logger.error(`[IngestionService] Scheduler failed for ${gameId}`, e);
                }
            }

            // 2. Pro Player prioritized ingestion (including Japan)
            await this.ingestProPlayers();

            // 3. Process the queue
            await this.processQueue('sf6', 15);
            await this.processQueue(undefined, 10);
        }, intervalMs);
    }

    /**
     * Specialized ingestion for top-tier players
     */
    async ingestProPlayers(): Promise<void> {
        try {
            const { ProPlayer } = await import('../models/ProPlayer');
            const pros = await ProPlayer.find({ isVerified: true }).lean().exec();
            
            for (const pro of pros) {
                for (const channel of pro.channels) {
                    // Search for recent matches by this specific pro
                    const query = `${pro.name} ${pro.gameId} high level ranked match pro player`;
                    const urls = await this.searchYouTube(query, 3);
                    
                    for (const url of urls) {
                        const existing = await this.ingestionRepository.findByUrl(url);
                        if (existing) continue;

                        await this.ingestionRepository.createJob({
                            job_id: UuidHelper.generate(),
                            game_id: pro.gameId,
                            youtube_url: url,
                            search_query: `PRO_SCOUT: ${pro.name} (${pro.region})`,
                            source: 'pro_scout',
                            status: 'pending',
                            retry_count: 0,
                            pro_player_id: (pro as any)._id.toString()
                        });
                    }
                }
                // Mark pro as recently updated
                await ProPlayer.updateOne({ _id: (pro as any)._id }, { lastIngestJobAt: new Date() });
            }
        } catch (e) {
            Logger.error('[IngestionService] Pro player ingestion failed', e);
        }
    }

    stopScheduler(): void {
        if (this.schedulerTimer) {
            clearInterval(this.schedulerTimer);
            this.schedulerTimer = null;
            Logger.info('[IngestionService] Scheduler stopped');
        }
    }

    /**
     * Use yt-dlp to search YouTube and return video URLs
     * yt-dlp --flat-playlist "ytsearch5:query" --print webpage_url
     */
    private async searchYouTube(query: string, maxResults: number = 3): Promise<string[]> {
        try {
            // Check yt-dlp is available
            await execAsync('yt-dlp --version', { timeout: 5000 });
        } catch {
            Logger.error('[IngestionService] yt-dlp is not installed or not on PATH. Use the admin seed-urls endpoint to queue videos manually.');
            return [];
        }

        try {
            const safeQuery = query.replace(/"/g, '\\"');
            const cmd = `yt-dlp --flat-playlist "ytsearch${maxResults}:${safeQuery}" --print webpage_url --no-warnings`;
            const { stdout, stderr } = await execAsync(cmd, { timeout: 30000 });
            if (stderr) Logger.warn(`[IngestionService] yt-dlp stderr for "${query}": ${stderr.slice(0, 200)}`);
            const urls = stdout
                .split('\n')
                .map(line => line.trim())
                .filter(line => line.startsWith('https://www.youtube.com/watch'));
            Logger.info(`[IngestionService] yt-dlp found ${urls.length} URLs for: ${query}`);
            return urls;
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            Logger.error(`[IngestionService] yt-dlp search failed for: "${query}" — ${msg}`);
            return [];
        }
    }
}
