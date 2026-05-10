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
import { queueService } from './QueueService';

import { normalizeYoutubeUrl, isBadVideoTitle } from '../helpers/youtubeHelper';

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
    mvc3: [
        'UMVC3 tournament grand finals high level',
        'Marvel vs Capcom 3 pro player tournament match',
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
                const searchResults = await this.searchYouTube(query, Math.ceil(maxVideos / queries.length));

                for (const res of searchResults) {
                    try {
                        const url = normalizeYoutubeUrl(res.url);
                        
                        // Skip if title indicates non-match content
                        if (isBadVideoTitle(res.title)) {
                            Logger.info(`[IngestionService] Skipping non-match content: ${res.title}`);
                            result.skipped_count++;
                            continue;
                        }

                        // Skip if already ingested
                        const existing = await this.ingestionRepository.findByUrl(url);
                        if (existing) {
                            result.skipped_count++;
                            continue;
                        }

                        const job = await this.ingestionRepository.createJob({
                            job_id: UuidHelper.generate(),
                            game_id: gameId,
                            youtube_url: url,
                            search_query: query,
                            source: 'scheduled',
                            status: 'pending',
                            retry_count: 0,
                            metadata: { title: res.title }
                        });

                        // Enqueue for background processing
                        await queueService.addAnalysisJob({
                            job_id: job.job_id,
                            game_id: gameId,
                            youtube_url: url,
                            metadata: { title: res.title }
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
                    const videoTitle = (job as any).metadata?.title;
                    const analysisResult = await this.analysisService.analyzeVideo({
                        youtube_url: job.youtube_url,
                        game_id: job.game_id,
                        pro_player_id: proPlayerId,
                        video_title: videoTitle,
                        metadata: (job as any).metadata
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
    startScheduler(intervalMs: number = 6 * 60 * 60 * 1000): void {
        if (this.schedulerTimer) {
            Logger.warn('[IngestionService] Scheduler already running');
            return;
        }

        Logger.info(`[IngestionService] Starting ingestion scheduler (every ${intervalMs / 3600000}h)`);

        const runIngestion = async () => {
            // 1. Regular search-based ingestion
            const gameIds = Object.keys(GAME_SEARCH_QUERIES);
            gameIds.sort((a, b) => (a === 'sf6' ? -1 : b === 'sf6' ? 1 : 0));

            for (const gameId of gameIds) {
                try {
                    const maxVideosToFetch = gameId === 'sf6' ? 10 : 5;
                    await this.triggerIngestion(gameId, maxVideosToFetch);
                } catch (e) {
                    Logger.error(`[IngestionService] Scheduler failed for ${gameId}`, e);
                }
            }

            // 2. Pro Player prioritized ingestion (including Japan)
            // Using Direct Playlist Tracking to save quota (1 unit vs 100 units for search)
            await this.ingestProPlayersDirect();
        };

        // Run once immediately on startup
        runIngestion().catch(err => {
            Logger.error('[IngestionService] Initial ingestion run failed', err);
        });

        this.schedulerTimer = setInterval(runIngestion, intervalMs);
    }

    /**
     * Specialized ingestion for top-tier players using Direct Playlist Tracking (Cheapest Quota)
     * This uses playlistItems.list which costs only 1 unit per call (vs 100 for search).
     */
    async ingestProPlayersDirect(): Promise<void> {
        try {
            const { ProPlayer } = await import('../models/ProPlayer');
            const pros = await ProPlayer.find({ isVerified: true }).lean().exec();
            
            Logger.info(`[IngestionService] Starting Direct Playlist scan for ${pros.length} verified pros`);

            const apiKey = process.env.YOUTUBE_API_KEY;
            if (!apiKey) {
                Logger.warn('[IngestionService] Skipping direct scan: YOUTUBE_API_KEY missing');
                return;
            }

            for (const pro of pros) {
                for (const channel of pro.channels) {
                    // Extract channel ID if it's a full URL
                    const channelId = channel.includes('/') ? channel.split('/').pop() : channel;
                    if (!channelId || !channelId.startsWith('UC')) continue;

                    // Uploads Playlist ID is the Channel ID with 'UU' instead of 'UC'
                    const uploadsPlaylistId = 'UU' + channelId.slice(2);
                    const videos = await this.fetchRecentVideosViaPlaylist(uploadsPlaylistId, apiKey);
                    const limitedVideos = videos.slice(0, 3); // Check top 3 to find a good one
                    
                    for (const v of limitedVideos) {
                        const url = normalizeYoutubeUrl(v.url);

                        if (isBadVideoTitle(v.title)) continue;

                        const existing = await this.ingestionRepository.findByUrl(url);
                        if (existing) continue;

                        const job = await this.ingestionRepository.createJob({
                            job_id: UuidHelper.generate(),
                            game_id: pro.gameId,
                            youtube_url: url,
                            search_query: `PLAYLIST_TRACK: ${pro.name} (${pro.region})`,
                            source: 'pro_scout',
                            status: 'pending',
                            retry_count: 0,
                            pro_player_id: (pro as any)._id.toString()
                        });

                        // Enqueue for background processing
                        await queueService.addAnalysisJob({
                            job_id: job.job_id,
                            game_id: pro.gameId,
                            youtube_url: url,
                            pro_player_id: (pro as any)._id.toString()
                        });
                        
                        Logger.info(`[IngestionService] Queued new pro match via Playlist Tracking: ${url} (${pro.name})`);
                    }
                }
                // Mark pro as recently updated
                await ProPlayer.updateOne({ _id: (pro as any)._id }, { lastIngestJobAt: new Date() });
            }
        } catch (e) {
            Logger.error('[IngestionService] Pro player direct ingestion failed', e);
        }
    }

    /**
     * Fetch the 5 most recent videos from a playlist using the YouTube API.
     * COST: 1 unit per call.
     */
    private async fetchRecentVideosViaPlaylist(playlistId: string, apiKey: string): Promise<string[]> {
        try {
            const params = new URLSearchParams({
                part: 'snippet',
                playlistId: playlistId,
                maxResults: '5',
                key: apiKey,
            });

            const response = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?${params}`);
            
            if (!response.ok) {
                const errorText = await response.text();
                Logger.warn(`[IngestionService] Playlist API error for ${playlistId}: ${errorText.slice(0, 100)}`);
                return [];
            }

            const data = await response.json();
            return (data.items || [])
                .map((item: any) => ({
                    url: `https://www.youtube.com/watch?v=${item.snippet?.resourceId?.videoId}`,
                    title: item.snippet?.title || ''
                }))
                .filter((v: any) => v.url.includes('watch?v='));
        } catch (e) {
            Logger.error(`[IngestionService] Playlist fetch error for ${playlistId}:`, e);
            return [];
        }
    }

    /**
     * Fetch the 15 most recent videos from a YouTube channel RSS feed.
     * ZERO API QUOTA USAGE (but prone to 404s due to YouTube rate-limiting).
     */
    private async fetchRecentVideosFromRss(channelId: string): Promise<string[]> {
        try {
            const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
            const response = await fetch(rssUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });
            
            if (!response.ok) {
                Logger.warn(`[IngestionService] RSS feed unavailable for ${channelId}: ${response.status}`);
                return [];
            }

            const xml = await response.text();
            
            // Extract video IDs using regex from <yt:videoId> tags
            const videoIdMatches = xml.matchAll(/<yt:videoId>([^<]+)<\/yt:videoId>/g);
            const urls: string[] = [];
            
            for (const match of videoIdMatches) {
                if (match[1]) {
                    urls.push(`https://www.youtube.com/watch?v=${match[1]}`);
                }
            }

            // Also check for <link href=".../watch?v=..."/>
            const linkMatches = xml.matchAll(/href="https:\/\/www\.youtube\.com\/watch\?v=([^"]+)"/g);
            for (const match of linkMatches) {
                if (match[1]) {
                    const url = `https://www.youtube.com/watch?v=${match[1]}`;
                    if (!urls.includes(url)) urls.push(url);
                }
            }

            return urls.slice(0, 15); // Return most recent
        } catch (e) {
            Logger.error(`[IngestionService] RSS fetch error for ${channelId}:`, e);
            return [];
        }
    }

    /**
     * Legacy Search-based ingestion (CONSUMES QUOTA)
     */
    async ingestProPlayers(): Promise<void> {
        try {
            const { ProPlayer } = await import('../models/ProPlayer');
            const pros = await ProPlayer.find({ isVerified: true }).lean().exec();
            
            for (const pro of pros) {
                for (const channel of pro.channels) {
                    // Search for recent matches by this specific pro
                    const query = `${pro.name} ${pro.gameId} high level ranked match pro player`;
                    const urls = await this.searchYouTube(query, 1); // Only 1 result for pro scout search
                    
                    for (const url of urls) {
                        const existing = await this.ingestionRepository.findByUrl(url);
                        if (existing) continue;

                        const job = await this.ingestionRepository.createJob({
                            job_id: UuidHelper.generate(),
                            game_id: pro.gameId,
                            youtube_url: url,
                            search_query: `PRO_SCOUT: ${pro.name} (${pro.region})`,
                            source: 'pro_scout',
                            status: 'pending',
                            retry_count: 0,
                            pro_player_id: (pro as any)._id.toString()
                        });

                        // Enqueue for background processing
                        await queueService.addAnalysisJob({
                            job_id: job.job_id,
                            game_id: pro.gameId,
                            youtube_url: url,
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
    private async searchYouTube(query: string, maxResults: number = 3): Promise<{url: string, title: string}[]> {
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
    private async searchViaYouTubeApi(query: string, maxResults: number, apiKey: string): Promise<{url: string, title: string}[]> {
        try {
            const params = new URLSearchParams({
                part: 'snippet',
                q: query,
                type: 'video',
                maxResults: String(maxResults),
                videoDuration: 'medium', // 4-20 min — typical match length
                relevanceLanguage: 'en',
                order: 'relevance',
                key: apiKey,
            });

            const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);

            if (!response.ok) {
                const errorText = await response.text();
                Logger.error(`[IngestionService] YouTube API error (${response.status}): ${errorText.slice(0, 300)}`);
                return [];
            }

            const data = await response.json();
            const results = (data.items || [])
                .filter((item: any) => item.id?.videoId)
                .map((item: any) => ({
                    url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
                    title: item.snippet?.title || ''
                }));

            Logger.info(`[IngestionService] YouTube API found ${results.length} results for: ${query}`);
            return results;
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            Logger.error(`[IngestionService] YouTube API search failed: ${msg}`);
            return [];
        }
    }
}
