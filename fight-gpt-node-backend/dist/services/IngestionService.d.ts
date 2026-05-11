import { BaseService } from './BaseService';
import { IIngestionRepository } from '../repositories/IngestionRepository';
import { IAnalysisService } from './AnalysisService';
import { IMetaService } from './MetaService';
import { IGameSearchStrategyRepository } from '../repositories/GameSearchStrategyRepository';
import { ApiResponse } from '../types';
import { NotificationService } from './NotificationService';
export interface IngestionTriggerResult {
    game_id: string;
    queued_count: number;
    skipped_count: number;
    errors: string[];
}
export interface IIngestionService {
    triggerIngestion(gameId: string, maxVideos?: number): Promise<ApiResponse<IngestionTriggerResult>>;
    processQueue(gameId?: string, batchSize?: number): Promise<ApiResponse<{
        processed: number;
        failed: number;
    }>>;
    startScheduler(intervalMs?: number): void;
    stopScheduler(): void;
}
export declare class IngestionService extends BaseService implements IIngestionService {
    private readonly ingestionRepository;
    private readonly analysisService;
    private readonly metaService?;
    private readonly searchStrategyRepository?;
    private readonly notificationService?;
    private schedulerTimer;
    private isProcessing;
    constructor(ingestionRepository: IIngestionRepository, analysisService: IAnalysisService, metaService?: IMetaService, searchStrategyRepository?: IGameSearchStrategyRepository, notificationService?: NotificationService);
    /**
     * Returns search queries for a game: DB-stored strategies first, hardcoded fallback.
     * This makes queries updatable from the admin panel without a redeploy.
     */
    private getSearchQueries;
    /**
     * Search YouTube for fighting game videos and queue them for analysis
     */
    triggerIngestion(gameId: string, maxVideos?: number): Promise<ApiResponse<IngestionTriggerResult>>;
    /**
     * Process pending ingestion jobs — runs analysis on each queued video
     */
    processQueue(gameId?: string, batchSize?: number): Promise<ApiResponse<{
        processed: number;
        failed: number;
    }>>;
    /**
     * Start background scheduler that triggers ingestion + processing on an interval
     * Default: every 1 hour
     */
    startScheduler(intervalMs?: number): void;
    /**
     * Specialized ingestion for top-tier players using Direct Playlist Tracking (Cheapest Quota)
     * This uses playlistItems.list which costs only 1 unit per call (vs 100 for search).
     */
    ingestProPlayersDirect(): Promise<void>;
    /**
     * Fetch the 5 most recent videos from a playlist using the YouTube API.
     * COST: 1 unit per call.
     */
    private fetchRecentVideosViaPlaylist;
    /**
     * Fetch the 15 most recent videos from a YouTube channel RSS feed.
     * ZERO API QUOTA USAGE (but prone to 404s due to YouTube rate-limiting).
     */
    private fetchRecentVideosFromRss;
    /**
     * Legacy Search-based ingestion (CONSUMES QUOTA)
     */
    ingestProPlayers(): Promise<void>;
    stopScheduler(): void;
    /**
     * Use YouTube Data API v3 to search for videos.
     * This is the primary and only search method (yt-dlp is deprecated).
     */
    private searchYouTube;
    /**
     * YouTube Data API v3 search — reliable, requires YOUTUBE_API_KEY env var
     * Free tier: 10,000 units/day (search costs 100 units each = ~100 searches/day)
     */
    private searchViaYouTubeApi;
}
//# sourceMappingURL=IngestionService.d.ts.map