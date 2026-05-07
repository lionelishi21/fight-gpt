"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.IngestionService = void 0;
const child_process_1 = require("child_process");
const util_1 = require("util");
const BaseService_1 = require("./BaseService");
const uuidHelper_1 = require("../helpers/uuidHelper");
const logger_1 = require("../helpers/logger");
const QueueService_1 = require("./QueueService");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
// Search queries per game — these surface tournament sets, pro player footage, high-level ranked
const GAME_SEARCH_QUERIES = {
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
const DEFAULT_QUERIES = (gameId) => [
    `${gameId} fighting game tournament 2024`,
    `${gameId} high level gameplay EVO`,
    `${gameId} pro player ranked match`,
];
class IngestionService extends BaseService_1.BaseService {
    ingestionRepository;
    analysisService;
    metaService;
    searchStrategyRepository;
    schedulerTimer = null;
    isProcessing = false;
    constructor(ingestionRepository, analysisService, metaService, searchStrategyRepository) {
        super();
        this.ingestionRepository = ingestionRepository;
        this.analysisService = analysisService;
        this.metaService = metaService;
        this.searchStrategyRepository = searchStrategyRepository;
    }
    /**
     * Returns search queries for a game: DB-stored strategies first, hardcoded fallback.
     * This makes queries updatable from the admin panel without a redeploy.
     */
    async getSearchQueries(gameId) {
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
    async triggerIngestion(gameId, maxVideos = 15) {
        const queries = await this.getSearchQueries(gameId);
        const result = {
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
                        const job = await this.ingestionRepository.createJob({
                            job_id: uuidHelper_1.UuidHelper.generate(),
                            game_id: gameId,
                            youtube_url: url,
                            search_query: query,
                            source: 'scheduled',
                            status: 'pending',
                            retry_count: 0,
                        });
                        // Enqueue for background processing
                        await QueueService_1.queueService.addAnalysisJob({
                            job_id: job.job_id,
                            game_id: gameId,
                            youtube_url: url
                        });
                        result.queued_count++;
                    }
                    catch (e) {
                        // Likely duplicate URL index violation — skip silently
                        result.skipped_count++;
                    }
                }
            }
            catch (e) {
                const msg = e instanceof Error ? e.message : 'Search failed';
                result.errors.push(`Query "${query}": ${msg}`);
                logger_1.Logger.warn(`[IngestionService] Search failed for query: ${query}`, e);
            }
        }
        logger_1.Logger.info(`[IngestionService] Ingestion triggered for ${gameId}: ${result.queued_count} queued, ${result.skipped_count} skipped`);
        return {
            success: true,
            data: result,
            message: `Elite ingestion triggered for ${gameId}: ${result.queued_count} queued, ${result.skipped_count} skipped`,
        };
    }
    /**
     * Process pending ingestion jobs — runs analysis on each queued video
     */
    async processQueue(gameId, batchSize = 10) {
        if (this.isProcessing) {
            return { success: false, error: 'Queue processor already running' };
        }
        this.isProcessing = true;
        let processed = 0;
        let failed = 0;
        try {
            const jobs = await this.ingestionRepository.getPendingJobs(gameId, batchSize);
            logger_1.Logger.info(`[IngestionService] Processing ${jobs.length} pending jobs`);
            // Process jobs sequentially to respect rate limits (e.g. Gemini 5 RPM)
            for (const job of jobs) {
                try {
                    // Mark as processing
                    await this.ingestionRepository.updateJobStatus(job.job_id, 'processing');
                    // Run the analysis pipeline
                    const proPlayerId = job.metadata?.pro_player_id;
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
                        });
                        processed++;
                        logger_1.Logger.info(`[IngestionService] Completed job ${job.job_id} — ${scenarioCount} scenarios extracted`);
                    }
                    else {
                        throw new Error(analysisResult.error || 'Analysis returned no data');
                    }
                }
                catch (e) {
                    const msg = e instanceof Error ? e.message : 'Unknown error';
                    const shouldRetry = job.retry_count < 2;
                    await this.ingestionRepository.updateJobStatus(job.job_id, shouldRetry ? 'pending' : 'failed', {
                        error_message: msg,
                        retry_count: job.retry_count + 1,
                    });
                    failed++;
                    logger_1.Logger.warn(`[IngestionService] Job ${job.job_id} failed (retry ${job.retry_count + 1}): ${msg}`);
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
                    logger_1.Logger.info(`[IngestionService] Auto-triggering meta synthesis for ${gid} (${processed} new videos)`);
                    this.metaService.generateMetaReport(gid, 'weekly').catch(e => logger_1.Logger.warn(`[IngestionService] Meta auto-gen failed for ${gid}: ${e instanceof Error ? e.message : e}`));
                }
            }
            return {
                success: true,
                data: { processed, failed },
                message: `Queue processed: ${processed} completed, ${failed} failed`,
            };
        }
        finally {
            this.isProcessing = false;
        }
    }
    /**
     * Start background scheduler that triggers ingestion + processing on an interval
     * Default: every 1 hour
     */
    startScheduler(intervalMs = 1 * 60 * 60 * 1000) {
        if (this.schedulerTimer) {
            logger_1.Logger.warn('[IngestionService] Scheduler already running');
            return;
        }
        logger_1.Logger.info(`[IngestionService] Starting ingestion scheduler (every ${intervalMs / 3600000}h)`);
        const runIngestion = async () => {
            // 1. Regular search-based ingestion
            const gameIds = Object.keys(GAME_SEARCH_QUERIES);
            gameIds.sort((a, b) => (a === 'sf6' ? -1 : b === 'sf6' ? 1 : 0));
            for (const gameId of gameIds) {
                try {
                    const maxVideosToFetch = gameId === 'sf6' ? 50 : 20;
                    await this.triggerIngestion(gameId, maxVideosToFetch);
                }
                catch (e) {
                    logger_1.Logger.error(`[IngestionService] Scheduler failed for ${gameId}`, e);
                }
            }
            // 2. Pro Player prioritized ingestion (including Japan)
            // Using Direct Playlist Tracking to save quota (1 unit vs 100 units for search)
            await this.ingestProPlayersDirect();
        };
        // Run once immediately on startup
        runIngestion().catch(err => {
            logger_1.Logger.error('[IngestionService] Initial ingestion run failed', err);
        });
        this.schedulerTimer = setInterval(runIngestion, intervalMs);
    }
    /**
     * Specialized ingestion for top-tier players using Direct Playlist Tracking (Cheapest Quota)
     * This uses playlistItems.list which costs only 1 unit per call (vs 100 for search).
     */
    async ingestProPlayersDirect() {
        try {
            const { ProPlayer } = await Promise.resolve().then(() => __importStar(require('../models/ProPlayer')));
            const pros = await ProPlayer.find({ isVerified: true }).lean().exec();
            logger_1.Logger.info(`[IngestionService] Starting Direct Playlist scan for ${pros.length} verified pros`);
            const apiKey = process.env.YOUTUBE_API_KEY;
            if (!apiKey) {
                logger_1.Logger.warn('[IngestionService] Skipping direct scan: YOUTUBE_API_KEY missing');
                return;
            }
            for (const pro of pros) {
                for (const channel of pro.channels) {
                    // Extract channel ID if it's a full URL
                    const channelId = channel.includes('/') ? channel.split('/').pop() : channel;
                    if (!channelId || !channelId.startsWith('UC'))
                        continue;
                    // Uploads Playlist ID is the Channel ID with 'UU' instead of 'UC'
                    const uploadsPlaylistId = 'UU' + channelId.slice(2);
                    const urls = await this.fetchRecentVideosViaPlaylist(uploadsPlaylistId, apiKey);
                    for (const url of urls) {
                        const existing = await this.ingestionRepository.findByUrl(url);
                        if (existing)
                            continue;
                        const job = await this.ingestionRepository.createJob({
                            job_id: uuidHelper_1.UuidHelper.generate(),
                            game_id: pro.gameId,
                            youtube_url: url,
                            search_query: `PLAYLIST_TRACK: ${pro.name} (${pro.region})`,
                            source: 'pro_scout',
                            status: 'pending',
                            retry_count: 0,
                            pro_player_id: pro._id.toString()
                        });
                        // Enqueue for background processing
                        await QueueService_1.queueService.addAnalysisJob({
                            job_id: job.job_id,
                            game_id: pro.gameId,
                            youtube_url: url,
                            pro_player_id: pro._id.toString()
                        });
                        logger_1.Logger.info(`[IngestionService] Queued new pro match via Playlist Tracking: ${url} (${pro.name})`);
                    }
                }
                // Mark pro as recently updated
                await ProPlayer.updateOne({ _id: pro._id }, { lastIngestJobAt: new Date() });
            }
        }
        catch (e) {
            logger_1.Logger.error('[IngestionService] Pro player direct ingestion failed', e);
        }
    }
    /**
     * Fetch the 5 most recent videos from a playlist using the YouTube API.
     * COST: 1 unit per call.
     */
    async fetchRecentVideosViaPlaylist(playlistId, apiKey) {
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
                logger_1.Logger.warn(`[IngestionService] Playlist API error for ${playlistId}: ${errorText.slice(0, 100)}`);
                return [];
            }
            const data = await response.json();
            return (data.items || [])
                .map((item) => `https://www.youtube.com/watch?v=${item.snippet?.resourceId?.videoId}`)
                .filter((url) => url.includes('watch?v='));
        }
        catch (e) {
            logger_1.Logger.error(`[IngestionService] Playlist fetch error for ${playlistId}:`, e);
            return [];
        }
    }
    /**
     * Fetch the 15 most recent videos from a YouTube channel RSS feed.
     * ZERO API QUOTA USAGE (but prone to 404s due to YouTube rate-limiting).
     */
    async fetchRecentVideosFromRss(channelId) {
        try {
            const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
            const response = await fetch(rssUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });
            if (!response.ok) {
                logger_1.Logger.warn(`[IngestionService] RSS feed unavailable for ${channelId}: ${response.status}`);
                return [];
            }
            const xml = await response.text();
            // Extract video IDs using regex from <yt:videoId> tags
            const videoIdMatches = xml.matchAll(/<yt:videoId>([^<]+)<\/yt:videoId>/g);
            const urls = [];
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
                    if (!urls.includes(url))
                        urls.push(url);
                }
            }
            return urls.slice(0, 15); // Return most recent
        }
        catch (e) {
            logger_1.Logger.error(`[IngestionService] RSS fetch error for ${channelId}:`, e);
            return [];
        }
    }
    /**
     * Legacy Search-based ingestion (CONSUMES QUOTA)
     */
    async ingestProPlayers() {
        try {
            const { ProPlayer } = await Promise.resolve().then(() => __importStar(require('../models/ProPlayer')));
            const pros = await ProPlayer.find({ isVerified: true }).lean().exec();
            for (const pro of pros) {
                for (const channel of pro.channels) {
                    // Search for recent matches by this specific pro
                    const query = `${pro.name} ${pro.gameId} high level ranked match pro player`;
                    const urls = await this.searchYouTube(query, 3);
                    for (const url of urls) {
                        const existing = await this.ingestionRepository.findByUrl(url);
                        if (existing)
                            continue;
                        const job = await this.ingestionRepository.createJob({
                            job_id: uuidHelper_1.UuidHelper.generate(),
                            game_id: pro.gameId,
                            youtube_url: url,
                            search_query: `PRO_SCOUT: ${pro.name} (${pro.region})`,
                            source: 'pro_scout',
                            status: 'pending',
                            retry_count: 0,
                            pro_player_id: pro._id.toString()
                        });
                        // Enqueue for background processing
                        await QueueService_1.queueService.addAnalysisJob({
                            job_id: job.job_id,
                            game_id: pro.gameId,
                            youtube_url: url,
                            pro_player_id: pro._id.toString()
                        });
                    }
                }
                // Mark pro as recently updated
                await ProPlayer.updateOne({ _id: pro._id }, { lastIngestJobAt: new Date() });
            }
        }
        catch (e) {
            logger_1.Logger.error('[IngestionService] Pro player ingestion failed', e);
        }
    }
    stopScheduler() {
        if (this.schedulerTimer) {
            clearInterval(this.schedulerTimer);
            this.schedulerTimer = null;
            logger_1.Logger.info('[IngestionService] Scheduler stopped');
        }
    }
    /**
     * Use YouTube Data API v3 to search for videos.
     * This is the primary and only search method (yt-dlp is deprecated).
     */
    async searchYouTube(query, maxResults = 3) {
        const apiKey = process.env.YOUTUBE_API_KEY;
        if (apiKey) {
            return this.searchViaYouTubeApi(query, maxResults, apiKey);
        }
        logger_1.Logger.error('[IngestionService] YOUTUBE_API_KEY is missing. YouTube search is disabled.');
        return [];
    }
    /**
     * YouTube Data API v3 search — reliable, requires YOUTUBE_API_KEY env var
     * Free tier: 10,000 units/day (search costs 100 units each = ~100 searches/day)
     */
    async searchViaYouTubeApi(query, maxResults, apiKey) {
        try {
            const params = new URLSearchParams({
                part: 'id',
                q: query,
                type: 'video',
                maxResults: String(maxResults),
                videoDuration: 'medium', // 4-20 min — typical match length
                relevanceLanguage: 'en',
                order: 'date',
                key: apiKey,
            });
            const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
            if (!response.ok) {
                const errorText = await response.text();
                logger_1.Logger.error(`[IngestionService] YouTube API error (${response.status}): ${errorText.slice(0, 300)}`);
                return [];
            }
            const data = await response.json();
            const urls = (data.items || [])
                .filter((item) => item.id?.videoId)
                .map((item) => `https://www.youtube.com/watch?v=${item.id.videoId}`);
            logger_1.Logger.info(`[IngestionService] YouTube API found ${urls.length} URLs for: ${query}`);
            return urls;
        }
        catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            logger_1.Logger.error(`[IngestionService] YouTube API search failed: ${msg}`);
            return [];
        }
    }
}
exports.IngestionService = IngestionService;
//# sourceMappingURL=IngestionService.js.map