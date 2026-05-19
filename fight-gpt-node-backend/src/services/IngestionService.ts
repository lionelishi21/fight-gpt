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
import { NotificationService } from './NotificationService';
import { YoutubeBotBlockError } from '../helpers/youtubeDownloader';
import mongoose from 'mongoose';

const execAsync = promisify(exec);

// Game abbreviations used in YouTube search queries
const GAME_SHORT: Record<string, string> = {
    sf6: 'SF6', tekken8: 'Tekken 8', ggst: 'Guilty Gear Strive',
    mk1: 'Mortal Kombat 1', dbfz: 'DBFZ', mvc3: 'UMVC3',
};

// Baseline general queries — used alongside character-specific ones for discoverability
const GAME_BASELINE_QUERIES: Record<string, string[]> = {
    sf6:     ['SF6 Capcom Cup 2025 top 8', 'Street Fighter 6 EVO 2025 top 8 grand finals'],
    tekken8: ['Tekken 8 TWT 2025 top 8 grand finals', 'Tekken 8 EVO 2025 top 8'],
    ggst:    ['Guilty Gear Strive 2025 tournament top 8', 'GGST Arc World Tour 2025'],
    mk1:     ['Mortal Kombat 1 Final Kombat 2025 top 8', 'MK1 CEO 2025 tournament'],
    dbfz:    ['DBFZ World Tour 2025 top 8', 'Dragon Ball FighterZ tournament 2025'],
    mvc3:    ['UMVC3 tournament 2025 grand finals', 'UMVC3 EVO top 8'],
};

// Target scenario count before a character is considered "covered"
const TARGET_SCENARIOS_PER_CHARACTER = 30;

// Default fallback queries for any game not in the list
const DEFAULT_QUERIES = (gameId: string) => [
    `${gameId} fighting game tournament 2025`,
    `${gameId} high level gameplay EVO 2025`,
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
        private readonly notificationService?: NotificationService,
    ) {
        super();
    }

    /**
     * Returns character-balanced search queries for a game.
     *
     * Strategy:
     * 1. Start with baseline tournament queries (general discoverability)
     * 2. Pull all characters for the game from the DB
     * 3. For each character, count existing scenarios in the vector DB
     * 4. Generate targeted queries for any character below TARGET_SCENARIOS_PER_CHARACTER
     * 5. Prioritise the most under-represented characters (fewest scenarios first)
     *
     * This prevents popular characters (Ken, Ryu, Luke) from dominating the
     * dataset while niche characters stay at 9 scenarios forever.
     *
     * Falls back to DB-stored strategies or hardcoded baseline if character data
     * is unavailable.
     */
    private async getSearchQueries(gameId: string): Promise<string[]> {
        // Admin-configured strategies take priority
        if (this.searchStrategyRepository) {
            const strategies = await this.searchStrategyRepository.findActive(gameId).catch(() => []);
            if (strategies.length > 0) {
                return strategies.flatMap(s => s.queries);
            }
        }

        const baseline = GAME_BASELINE_QUERIES[gameId] || DEFAULT_QUERIES(gameId);
        const gameShort = GAME_SHORT[gameId] || gameId.toUpperCase();

        try {
            const Character = mongoose.model('Character');
            const Scenario = mongoose.model('Scenario');

            const characters = await Character.find({ game_id: gameId })
                .select('name character_id')
                .lean()
                .exec();

            if (!characters.length) return baseline;

            // Count scenarios per character (check both P1 and P2 slots)
            const scenarioCounts = await Promise.all(
                characters.map(async (char: any) => {
                    const name = char.name || char.character_id || '';
                    const count = await Scenario.countDocuments({
                        game_id: gameId,
                        characters_involved: { $regex: new RegExp(name, 'i') },
                    }).catch(() => 0);
                    return { name, count };
                })
            );

            // Sort by coverage ascending — most under-represented first
            scenarioCounts.sort((a, b) => a.count - b.count);

            const needsData = scenarioCounts.filter(c => c.count < TARGET_SCENARIOS_PER_CHARACTER);

            Logger.info(
                `[IngestionService] Coverage for ${gameId}: ` +
                `${needsData.length}/${characters.length} chars below ${TARGET_SCENARIOS_PER_CHARACTER} scenarios. ` +
                `Lowest: ${scenarioCounts.slice(0, 3).map(c => `${c.name}(${c.count})`).join(', ')}`
            );

            // Generate targeted queries for the top 5 most under-represented characters
            const characterQueries: string[] = [];
            for (const char of needsData.slice(0, 5)) {
                characterQueries.push(
                    `${gameShort} ${char.name} ranked match high level gameplay 2025`,
                    `${gameShort} ${char.name} tournament match pro player`,
                );
            }

            // Interleave: baseline first for general coverage, then character-targeted
            return [...baseline, ...characterQueries];

        } catch (e) {
            Logger.warn(`[IngestionService] Character-balance query failed, using baseline: ${e instanceof Error ? e.message : e}`);
            return baseline;
        }
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
                            video_title: res.title
                        });

                        // Enqueue for background processing
                        await queueService.addAnalysisJob({ source: 'ingestion',
                            job_id: job.job_id,
                            game_id: gameId,
                            youtube_url: url,
                            video_title: res.title
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
                    const proPlayerId = job.pro_player_id;
                    const videoTitle = job.video_title;
                    const analysisResult = await this.analysisService.analyzeVideo({
                        youtube_url: job.youtube_url,
                        game_id: job.game_id,
                        pro_player_id: proPlayerId,
                        video_title: videoTitle,
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

                    if (e && (e as Error).name === 'YoutubeBotBlockError') {
                        Logger.error(`[IngestionService] YouTube bot block detected for job ${job.job_id}`);
                        if (this.notificationService) {
                            await this.notificationService.systemAlert(
                                'YouTube Bot Block Detected',
                                'yt-dlp was blocked by YouTube. Video ingestion has failed. Please update the cookies.txt file via the admin dashboard.'
                            );
                        }
                    }

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
     * Bulk-enqueue ALL pending jobs from MongoDB into the BullMQ Redis queue.
     * The worker then drains them automatically at 5/min with retries.
     * Safe to call multiple times — BullMQ deduplicates by job_id.
     */
    async bulkQueuePending(gameId?: string): Promise<{ queued: number; skipped: number; errors: string[] }> {
        const result = { queued: 0, skipped: 0, errors: [] as string[] };

        // Fetch all pending jobs (no batchSize cap — we want all 660)
        const jobs = await this.ingestionRepository.getPendingJobs(gameId, 10000);
        Logger.info(`[IngestionService] Bulk queuing ${jobs.length} pending jobs into Redis...`);

        for (const job of jobs) {
            try {
                await queueService.addAnalysisJob({ source: 'ingestion',
                    job_id: job.job_id,
                    game_id: job.game_id,
                    youtube_url: job.youtube_url,
                    pro_player_id: job.pro_player_id,
                    video_title: job.video_title,
                });
                result.queued++;
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                result.errors.push(`${job.job_id}: ${msg}`);
                result.skipped++;
            }
        }

        Logger.info(`[IngestionService] Bulk queue complete — ${result.queued} queued, ${result.skipped} skipped`);
        return result;
    }

    /**
     * Start background scheduler that triggers ingestion + processing on an interval
     * Default: every 6 hours
     */
    startScheduler(intervalMs: number = 6 * 60 * 60 * 1000): void {
        if (this.schedulerTimer) {
            Logger.warn('[IngestionService] Scheduler already running');
            return;
        }

        Logger.info(`[IngestionService] Starting ingestion scheduler (every ${intervalMs / 3600000}h)`);

        const runIngestion = async () => {
            try {
                // 1. Fetch all active games from the DB (Dynamically discover new games)
                const { Game } = await import('../models/Game');
                const games = await Game.find({ is_active: true }).lean().exec();
                
                Logger.info(`[IngestionService] Scheduler running discovery for ${games.length} active games`);

                for (const game of games) {
                    try {
                        const gameId = game.game_id;
                        // Prioritize SF6 for more videos
                        const maxVideosToFetch = gameId === 'sf6' ? 10 : 5;
                        
                        Logger.info(`[IngestionService] Triggering discovery for ${game.name} (${gameId})...`);
                        await this.triggerIngestion(gameId, maxVideosToFetch);
                    } catch (e) {
                        Logger.error(`[IngestionService] Scheduler failed for game ${(game as any).game_id}`, e);
                    }
                }

                // 2. Pro Player prioritized ingestion (including Japan)
                // Using Direct Playlist Tracking to save quota (1 unit vs 100 units for search)
                await this.ingestProPlayersDirect();
                
                Logger.info('[IngestionService] Daily discovery cycle complete.');
            } catch (err) {
                Logger.error('[IngestionService] Scheduler loop failed', err);
            }
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
                            pro_player_id: (pro as any)._id.toString(),
                            video_title: v.title
                        });

                        // Enqueue for background processing
                        await queueService.addAnalysisJob({ source: 'ingestion',
                            job_id: job.job_id,
                            game_id: pro.gameId,
                            youtube_url: url,
                            pro_player_id: (pro as any)._id.toString(),
                            video_title: v.title
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
    private async fetchRecentVideosViaPlaylist(playlistId: string, apiKey: string): Promise<{url: string, title: string}[]> {
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
                    const query = `${pro.name} ${pro.gameId} high level ranked match pro player`;
                    const searchResults = await this.searchYouTube(query, 1); // Only 1 result for pro scout search
                    
                    for (const res of searchResults) {
                        const url = res.url;
                        const existing = await this.ingestionRepository.findByUrl(url);
                        if (existing) continue;

                        const job = await this.ingestionRepository.createJob({
                            job_id: UuidHelper.generate(),
                            game_id: pro.gameId,
                            youtube_url: url,
                            video_title: res.title,
                            search_query: `PRO_SCOUT: ${pro.name} (${pro.region})`,
                            source: 'pro_scout',
                            status: 'pending',
                            retry_count: 0,
                            pro_player_id: (pro as any)._id.toString()
                        });

                        // Enqueue for background processing
                        await queueService.addAnalysisJob({ source: 'ingestion',
                            job_id: job.job_id,
                            game_id: pro.gameId,
                            youtube_url: url,
                            video_title: res.title,
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
