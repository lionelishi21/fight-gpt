import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { IAdminService } from '../services/AdminService';
import { IIngestionService } from '../services/IngestionService';
import { IMetaService } from '../services/MetaService';
import { AutoResearchService } from '../services/AutoResearchService';
import { ITrendAnalysisService } from '../services/TrendAnalysisService';
import { RosterSyncService } from '../services/RosterSyncService';
export declare class AdminController extends BaseController {
    private readonly adminService;
    private readonly ingestionService?;
    private readonly metaService?;
    private readonly autoResearchService?;
    private readonly trendAnalysisService?;
    private readonly onboardingService;
    private readonly patchService;
    private readonly rosterSyncService?;
    constructor(adminService: IAdminService, ingestionService?: IIngestionService, metaService?: IMetaService, autoResearchService?: AutoResearchService, trendAnalysisService?: ITrendAnalysisService, rosterSyncService?: RosterSyncService);
    /**
     * GET /api/admin/stats
     * Get system health and queue status
     */
    getSystemStats: (req: Request, res: Response) => Promise<void>;
    /**
     * POST /api/admin/trends/analyze
     * Trigger a manual Meta-Shift analysis check
     */
    triggerTrendAnalysis: (req: Request, res: Response) => Promise<void>;
    /**
     * GET /api/admin/jobs
     * List recent ingestion jobs
     */
    getRecentJobs: (req: Request, res: Response) => Promise<void>;
    /**
     * GET /api/admin/analyses
     * List recent analyses
     */
    getRecentAnalyses: (req: Request, res: Response) => Promise<void>;
    /**
     * DELETE /api/admin/analyses/:id
     * Delete a specific analysis
     */
    deleteAnalysis: (req: Request, res: Response) => Promise<void>;
    /**
     * POST /api/admin/jobs/retry
     * Force retry a failed job
     */
    retryJob: (req: Request, res: Response) => Promise<void>;
    /**
     * POST /api/admin/analyses/:id/reanalyze
     * Force re-analysis of a specific record
     */
    reanalyzeAnalysis: (req: Request, res: Response) => Promise<void>;
    /**
     * POST /api/admin/ingestion/trigger
     * Manually trigger analysis for a specific URL
     */
    triggerManualUrl: (req: Request, res: Response) => Promise<void>;
    /**
     * GET /api/admin/users
     * List all users with tier, role, slots, gamification
     */
    getUsers: (req: Request, res: Response) => Promise<void>;
    /**
     * GET /api/admin/games
     * List all games (active + inactive)
     */
    getGames: (req: Request, res: Response) => Promise<void>;
    /**
     * POST /api/admin/games
     * Create a new game
     */
    createGame: (req: Request, res: Response) => Promise<void>;
    /**
     * PATCH /api/admin/games/:gameId/status
     * Toggle game active/inactive (current/soon)
     */
    setGameStatus: (req: Request, res: Response) => Promise<void>;
    /**
     * PUT /api/admin/games/:gameId
     * Update game fields
     */
    updateGame: (req: Request, res: Response) => Promise<void>;
    /**
     * POST /api/admin/games/:gameId/bump-patch
     * Set a new current patch version for a game.
     * Updates Game.latest_version and for each character:
     *   - marks old encyclopedia docs as is_current_patch: false
     *   - creates new encyclopedia doc for the new patch (carrying current moveset/rules/videos)
     * Body: { patch_version: string }
     */
    bumpEncyclopediaPatch: (req: Request, res: Response) => Promise<void>;
    /**
     * POST /api/admin/research/trigger
     * Manually run the Karpathy auto-research cycle without waiting for the 2am cron
     */
    triggerResearch: (_req: Request, res: Response) => Promise<void>;
    /**
     * POST /api/admin/ingestion/seed
     * Bulk queue an array of known tournament YouTube URLs — bypasses yt-dlp search
     * Body: { gameId: string, youtubeUrls: string[] }
     */
    seedUrls: (req: Request, res: Response) => Promise<void>;
    /**
     * POST /api/admin/ingestion/seed-and-process
     * One-shot: queue URLs (or scrape via yt-dlp if none given), process the queue,
     * and optionally generate a meta report — all in a single call.
     *
     * Body: {
     *   game_id: string,
     *   youtube_urls?: string[],   // if omitted, scrapes YouTube instead
     *   max_videos?: number,       // used when scraping (default 5)
     *   batch_size?: number,       // videos to process this run (default 3)
     *   generate_meta?: boolean,   // generate meta report after processing (default false)
     * }
     */
    seedAndProcess: (req: Request, res: Response) => Promise<void>;
    /**
     * GET /api/admin/characters
     * List characters (optionally filtered by gameId)
     */
    getCharacters: (req: Request, res: Response) => Promise<void>;
    /**
     * POST /api/admin/characters
     * Create a new character
     */
    createCharacter: (req: Request, res: Response) => Promise<void>;
    /**
     * PATCH /api/admin/characters/:id
     * Update character metadata
     */
    updateCharacter: (req: Request, res: Response) => Promise<void>;
    /**
     * DELETE /api/admin/characters/:id
     * Delete a character
     */
    deleteCharacter: (req: Request, res: Response) => Promise<void>;
    /**
     * POST /api/admin/games/onboard
     * One-call game onboarding: creates Game + Characters + Encyclopedia + SearchStrategies + queues ingestion
     */
    onboardGame: (req: Request, res: Response) => Promise<void>;
    /**
     * GET /api/admin/games/:gameId/search-strategies
     * List all search strategies for a game
     */
    getSearchStrategies: (req: Request, res: Response) => Promise<void>;
    /**
     * POST /api/admin/games/:gameId/search-strategies
     * Add or replace search strategies for a game
     */
    upsertSearchStrategies: (req: Request, res: Response) => Promise<void>;
    /**
     * DELETE /api/admin/games/:gameId/search-strategies/:id
     * Deactivate a search strategy
     */
    deactivateSearchStrategy: (req: Request, res: Response) => Promise<void>;
    /**
     * POST /api/admin/games/:gameId/patch
     * Declare a new patch — archives old chars, bumps versions, queues post-patch ingestion
     * Body: { version, changed_characters[], patch_notes_url? }
     */
    declarePatch: (req: Request, res: Response) => Promise<void>;
    /**
     * GET /api/admin/games/:gameId/patches
     * Get patch history for a game
     */
    getPatchHistory: (req: Request, res: Response) => Promise<void>;
    /**
     * POST /api/admin/games/:gameId/sync
     * Manually trigger roster and frame data sync for a game
     */
    syncGameData: (req: Request, res: Response) => Promise<void>;
    /**
     * GET /api/admin/theory/staging
     * Get all pending theories for staging
     */
    getStagingTheories: (req: Request, res: Response) => Promise<void>;
    /**
     * PATCH /api/admin/theory/:id/status
     * Update theory status and optional content
     */
    updateTheoryStatus: (req: Request, res: Response) => Promise<void>;
    /**
     * POST /api/admin/settings/cookie
     * Upload a new cookies.txt file for YouTube ingestion
     */
    uploadCookies: (req: Request, res: Response) => Promise<void>;
    /**
     * GET /api/admin/settings/cookie/status
     * Check if a cookies.txt file exists and its status
     */
    getCookieStatus: (_req: Request, res: Response) => Promise<void>;
}
//# sourceMappingURL=AdminController.d.ts.map