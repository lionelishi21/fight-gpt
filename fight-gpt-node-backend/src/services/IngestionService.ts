import { exec } from 'child_process';
import { promisify } from 'util';
import { BaseService } from './BaseService';
import { IIngestionRepository } from '../repositories/IngestionRepository';
import { IAnalysisService } from './AnalysisService';
import { IMetaService } from './MetaService';
import { IGameSearchStrategyRepository } from '../repositories/GameSearchStrategyRepository';
import { ApiResponse } from '../types';
import { UuidHelper } from '../helpers/uuidHelper';
import { Logger } from '../helpers/logger';

const execAsync = promisify(exec);

// Search queries per game — these surface tournament sets, pro player footage, high-level ranked
const GAME_SEARCH_QUERIES: Record<string, string[]> = {
    sf6: [
        'SF6 tournament 2024 top 8 official',
        'Street Fighter 6 pro player tournament grand finals',
        'SF6 Capcom Cup match high level',
    ],
    tekken8: [
        'Tekken 8 TWT 2024 top 8 tournament',
        'Tekken 8 pro player ranked match high level',
        'Tekken 8 EVO grand finals',
    ],
    ggst: [
        'Guilty Gear Strive tournament 2024 top 8',
        'GGST pro player ranked high level match',
    ],
    mk1: [
        'Mortal Kombat 1 Final Kombat 2024 top 8',
        'MK1 pro player tournament match',
    ],
    dbfz: [
        'DBFZ World Tour 2024 top 8 tournament',
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
        private readonly metaService?: IMetaService,
        private readonly searchStrategyRepository?: IGameSearchStrategyRepository,
    ) {
        super();
    }

    /**
     * Returns search queries for a game: DB-stored strategies first, hardcoded fallback.
     * This makes queries updatable from the admin panel without a redeploy.
     */
    private async getSearchQueries(gameId: string): Promise<string[]> {
        if (this.searchStrategyRepository) {
            const strategies = await this.searchStrategyRepository.findActive(gameId).catch(() => []);
            if (strategies.length > 0) {
                return strategies.flatMap(s => s.queries);
            }
        }
        return GAME_SEARCH_QUERIES[gameId] || DEFAULT_QUERIES(gameId);
    }

    /**
     * Search YouTube for fighting game videos and queue them for analysis
     */
    async triggerIngestion(
        gameId: string,
        maxVideos: number = 15
    ): Promise<ApiResponse<IngestionTriggerResult>> {
        const queries = await this.getSearchQueries(gameId);
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
            message: `Elite ingestion triggered for ${gameId}: ${result.queued_count} queued, ${result.skipped_count} skipped`,
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

            // Process jobs sequentially to respect rate limits (e.g. Gemini 5 RPM)
            for (const job of jobs) {
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
                
                // Rate limit buffer (e.g. 60s between analysis requests to stay under token limits)
                if (jobs.indexOf(job) < jobs.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 60000));
                }
            }

            // Auto-trigger meta synthesis for any game that got new scenarios
            if (processed > 0 && this.metaService) {
                const affectedGames = [...new Set(jobs.map(j => j.game_id))];
                for (const gid of affectedGames) {
                    Logger.info(`[IngestionService] Auto-triggering meta synthesis for ${gid} (${processed} new videos)`);
                    this.metaService.generateMetaReport(gid, 'weekly').catch(e =>
                        Logger.warn(`[IngestionService] Meta auto-gen failed for ${gid}: ${e instanceof Error ? e.message : e}`)
                    );
                }
            }

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
     * Use YouTube Data API v3 to search for videos.
     * This is the primary and only search method (yt-dlp is deprecated).
     */
    private async searchYouTube(query: string, maxResults: number = 3): Promise<string[]> {
        const apiKey = process.env.YOUTUBE_API_KEY;
        if (apiKey) {
            return this.searchViaYouTubeApi(query, maxResults, apiKey);
        }

        Logger.error('[IngestionService] YOUTUBE_API_KEY is missing. YouTube search is disabled.');
        return [];
    }

    /**
     * YouTube Data API v3 search — reliable, requires YOUTUBE_API_KEY env var
     * Free tier: 10,000 units/day (search costs 100 units each = ~100 searches/day)
     */
    private async searchViaYouTubeApi(query: string, maxResults: number, apiKey: string): Promise<string[]> {
        try {
            const params = new URLSearchParams({
                part: 'id',
                q: query,
                type: 'video',
                maxResults: String(maxResults),
                videoDuration: 'medium', // 4-20 min — typical match length
                relevanceLanguage: 'en',
                key: apiKey,
            });

            const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);

            if (!response.ok) {
                const errorText = await response.text();
                Logger.error(`[IngestionService] YouTube API error (${response.status}): ${errorText.slice(0, 300)}`);
                return [];
            }

            const data = await response.json();
            const urls = (data.items || [])
                .filter((item: any) => item.id?.videoId)
                .map((item: any) => `https://www.youtube.com/watch?v=${item.id.videoId}`);

            Logger.info(`[IngestionService] YouTube API found ${urls.length} URLs for: ${query}`);
            return urls;
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            Logger.error(`[IngestionService] YouTube API search failed: ${msg}`);
            return [];
        }
    }
}


