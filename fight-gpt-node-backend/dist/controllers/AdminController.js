"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const BaseController_1 = require("./BaseController");
const User_1 = __importDefault(require("../models/User"));
const Game_1 = require("../models/Game");
const CharacterEncyclopediaRepository_1 = require("../repositories/CharacterEncyclopediaRepository");
const Character_1 = require("../models/Character");
const GameSearchStrategy_1 = require("../models/GameSearchStrategy");
const GameOnboardingService_1 = require("../services/GameOnboardingService");
const PatchService_1 = require("../services/PatchService");
class AdminController extends BaseController_1.BaseController {
    adminService;
    ingestionService;
    metaService;
    autoResearchService;
    onboardingService;
    patchService;
    constructor(adminService, ingestionService, metaService, autoResearchService) {
        super();
        this.adminService = adminService;
        this.ingestionService = ingestionService;
        this.metaService = metaService;
        this.autoResearchService = autoResearchService;
        this.onboardingService = new GameOnboardingService_1.GameOnboardingService(ingestionService);
        this.patchService = new PatchService_1.PatchService(ingestionService);
    }
    /**
     * GET /api/admin/stats
     * Get system health and queue status
     */
    getSystemStats = async (req, res) => {
        try {
            const result = await this.adminService.getSystemStats();
            this.sendResponse(res, result);
        }
        catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Controller failed');
        }
    };
    /**
     * GET /api/admin/jobs
     * List recent ingestion jobs
     */
    getRecentJobs = async (req, res) => {
        try {
            const limit = parseInt(req.query.limit) || 20;
            const status = req.query.status;
            const gameId = req.query.gameId;
            const result = await this.adminService.getIngestionJobs(limit, status, gameId);
            this.sendResponse(res, result);
        }
        catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Controller failed');
        }
    };
    /**
     * GET /api/admin/analyses
     * List recent analyses
     */
    getRecentAnalyses = async (req, res) => {
        try {
            const limit = parseInt(req.query.limit) || 20;
            const offset = parseInt(req.query.offset) || 0;
            const gameId = req.query.gameId;
            const search = req.query.search;
            const result = await this.adminService.getAnalyses(limit, offset, gameId, search);
            this.sendResponse(res, result);
        }
        catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Controller failed');
        }
    };
    /**
     * DELETE /api/admin/analyses/:id
     * Delete a specific analysis
     */
    deleteAnalysis = async (req, res) => {
        try {
            const { id } = req.params;
            if (!id) {
                res.status(400).json({ success: false, error: 'id is required' });
                return;
            }
            const result = await this.adminService.deleteAnalysis(id);
            this.sendResponse(res, result);
        }
        catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Controller failed');
        }
    };
    /**
     * POST /api/admin/jobs/retry
     * Force retry a failed job
     */
    retryJob = async (req, res) => {
        try {
            const { jobId } = req.body;
            if (!jobId) {
                res.status(400).json({ success: false, error: 'jobId is required' });
                return;
            }
            const result = await this.adminService.retryJob(jobId);
            this.sendResponse(res, result);
        }
        catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Controller failed');
        }
    };
    /**
     * POST /api/admin/ingestion/trigger
     * Manually trigger analysis for a specific URL
     */
    triggerManualUrl = async (req, res) => {
        try {
            const { gameId, youtubeUrl } = req.body;
            if (!gameId || !youtubeUrl) {
                res.status(400).json({ success: false, error: 'gameId and youtubeUrl are required' });
                return;
            }
            const result = await this.adminService.triggerManualUrl(gameId, youtubeUrl);
            this.sendResponse(res, result);
        }
        catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Controller failed');
        }
    };
    /**
     * GET /api/admin/users
     * List all users with tier, role, slots, gamification
     */
    getUsers = async (req, res) => {
        try {
            const limit = Math.min(parseInt(req.query.limit) || 50, 200);
            const offset = parseInt(req.query.offset) || 0;
            const search = req.query.search;
            const filter = {};
            if (search) {
                filter.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } },
                ];
            }
            const [users, total] = await Promise.all([
                User_1.default.find(filter)
                    .select('-password')
                    .sort({ createdAt: -1 })
                    .skip(offset)
                    .limit(limit)
                    .lean(),
                User_1.default.countDocuments(filter),
            ]);
            this.sendResponse(res, { success: true, data: { users, total, limit, offset } });
        }
        catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to fetch users');
        }
    };
    /**
     * GET /api/admin/games
     * List all games (active + inactive)
     */
    getGames = async (req, res) => {
        try {
            const games = await Game_1.Game.find({}).sort({ is_active: -1, name: 1 }).lean();
            this.sendResponse(res, { success: true, data: games });
        }
        catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to fetch games');
        }
    };
    /**
     * POST /api/admin/games
     * Create a new game
     */
    createGame = async (req, res) => {
        try {
            const { game_id, name, full_name, publisher, developer, description, platform, genre, latest_version, is_active } = req.body;
            if (!game_id || !name) {
                res.status(400).json({ success: false, error: 'game_id and name are required' });
                return;
            }
            const existing = await Game_1.Game.findOne({ game_id: game_id.toLowerCase() });
            if (existing) {
                res.status(409).json({ success: false, error: `Game with id "${game_id}" already exists` });
                return;
            }
            const game = await Game_1.Game.create({
                game_id: game_id.toLowerCase().trim(),
                name, full_name, publisher, developer, description,
                platform: platform || [],
                genre: genre || 'Fighting',
                latest_version,
                is_active: is_active !== undefined ? is_active : false,
            });
            this.sendResponse(res, { success: true, data: game });
        }
        catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to create game');
        }
    };
    /**
     * PATCH /api/admin/games/:gameId/status
     * Toggle game active/inactive (current/soon)
     */
    setGameStatus = async (req, res) => {
        try {
            const { gameId } = req.params;
            const { is_active } = req.body;
            if (typeof is_active !== 'boolean') {
                res.status(400).json({ success: false, error: 'is_active (boolean) is required' });
                return;
            }
            const game = await Game_1.Game.findOneAndUpdate({ game_id: gameId }, { is_active }, { new: true });
            if (!game) {
                res.status(404).json({ success: false, error: 'Game not found' });
                return;
            }
            this.sendResponse(res, { success: true, data: game });
        }
        catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to update game status');
        }
    };
    /**
     * PUT /api/admin/games/:gameId
     * Update game fields
     */
    updateGame = async (req, res) => {
        try {
            const { gameId } = req.params;
            const allowed = ['name', 'full_name', 'publisher', 'developer', 'description', 'platform', 'genre', 'latest_version', 'icon_url', 'banner_url'];
            const updates = {};
            allowed.forEach(k => { if (req.body[k] !== undefined)
                updates[k] = req.body[k]; });
            const game = await Game_1.Game.findOneAndUpdate({ game_id: gameId }, updates, { new: true });
            if (!game) {
                res.status(404).json({ success: false, error: 'Game not found' });
                return;
            }
            this.sendResponse(res, { success: true, data: game });
        }
        catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to update game');
        }
    };
    /**
     * POST /api/admin/games/:gameId/bump-patch
     * Set a new current patch version for a game.
     * Updates Game.latest_version and for each character:
     *   - marks old encyclopedia docs as is_current_patch: false
     *   - creates new encyclopedia doc for the new patch (carrying current moveset/rules/videos)
     * Body: { patch_version: string }
     */
    bumpEncyclopediaPatch = async (req, res) => {
        try {
            const { gameId } = req.params;
            const { patch_version } = req.body;
            if (!patch_version) {
                res.status(400).json({ success: false, error: 'patch_version is required' });
                return;
            }
            // Update the game's current patch label
            const game = await Game_1.Game.findOneAndUpdate({ game_id: gameId }, { latest_version: patch_version }, { new: true });
            if (!game) {
                res.status(404).json({ success: false, error: 'Game not found' });
                return;
            }
            // Bump encyclopedia for every character in this game
            const encyclopediaRepo = new CharacterEncyclopediaRepository_1.CharacterEncyclopediaRepository();
            const characters = await Character_1.Character.find({ game_id: gameId, is_current: true }).lean().exec();
            const results = await Promise.allSettled(characters.map((c) => encyclopediaRepo.bumpPatchVersion(gameId, c.character_id || c._id.toString(), patch_version)));
            const bumped = results.filter(r => r.status === 'fulfilled').length;
            const failed = results.filter(r => r.status === 'rejected').length;
            this.sendResponse(res, {
                success: true,
                data: { game_id: gameId, patch_version, bumped, failed },
            });
        }
        catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to bump patch version');
        }
    };
    /**
     * POST /api/admin/research/trigger
     * Manually run the Karpathy auto-research cycle without waiting for the 2am cron
     */
    triggerResearch = async (_req, res) => {
        if (!this.autoResearchService) {
            res.status(503).json({ success: false, error: 'Auto-research service unavailable' });
            return;
        }
        try {
            // Run in background to avoid HTTP timeout
            this.autoResearchService.runResearchCycle().catch(err => {
                console.error('[AdminController] Background research cycle failed:', err);
            });
            this.sendResponse(res, {
                success: true,
                message: 'Research cycle triggered in background. Check logs or wait for push notifications for results.'
            });
        }
        catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Research cycle trigger failed');
        }
    };
    /**
     * POST /api/admin/ingestion/seed
     * Bulk queue an array of known tournament YouTube URLs — bypasses yt-dlp search
     * Body: { gameId: string, youtubeUrls: string[] }
     */
    seedUrls = async (req, res) => {
        try {
            const { gameId, youtubeUrls } = req.body;
            if (!gameId || !Array.isArray(youtubeUrls) || youtubeUrls.length === 0) {
                res.status(400).json({ success: false, error: 'gameId and youtubeUrls[] are required' });
                return;
            }
            const result = await this.adminService.seedUrls(gameId, youtubeUrls);
            this.sendResponse(res, result);
        }
        catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Controller failed');
        }
    };
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
    seedAndProcess = async (req, res) => {
        if (!this.ingestionService) {
            res.status(503).json({ success: false, error: 'Ingestion service unavailable' });
            return;
        }
        try {
            const { game_id, youtube_urls, max_videos = 5, batch_size = 3, generate_meta = false, } = req.body;
            if (!game_id) {
                res.status(400).json({ success: false, error: 'game_id is required' });
                return;
            }
            // Step 1 — queue videos
            let queueResult;
            if (Array.isArray(youtube_urls) && youtube_urls.length > 0) {
                const r = await this.adminService.seedUrls(game_id, youtube_urls);
                queueResult = { queued_count: r.data?.queued, skipped_count: r.data?.skipped };
            }
            else {
                const r = await this.ingestionService.triggerIngestion(game_id, max_videos);
                queueResult = r.data ?? {};
            }
            // Step 2 — process the queue
            const processResult = await this.ingestionService.processQueue(game_id, batch_size);
            // Step 3 (optional) — generate meta report
            let metaResult = null;
            if (generate_meta && this.metaService) {
                const mr = await this.metaService.generateMetaReport(game_id, 'weekly');
                metaResult = mr.data;
            }
            this.sendResponse(res, {
                success: true,
                data: {
                    queue: queueResult,
                    process: processResult.data,
                    meta: metaResult,
                },
                message: `Seed-and-process complete for ${game_id}`,
            });
        }
        catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Controller failed');
        }
    };
    /**
     * GET /api/admin/characters
     * List characters (optionally filtered by gameId)
     */
    getCharacters = async (req, res) => {
        try {
            const gameId = req.query.gameId;
            const result = await this.adminService.getCharacters(gameId);
            this.sendResponse(res, result);
        }
        catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Controller failed');
        }
    };
    /**
     * POST /api/admin/characters
     * Create a new character
     */
    createCharacter = async (req, res) => {
        try {
            const result = await this.adminService.createCharacter(req.body);
            this.sendResponse(res, result);
        }
        catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Controller failed');
        }
    };
    /**
     * PATCH /api/admin/characters/:id
     * Update character metadata
     */
    updateCharacter = async (req, res) => {
        try {
            const { id } = req.params;
            const result = await this.adminService.updateCharacter(id, req.body);
            this.sendResponse(res, result);
        }
        catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Controller failed');
        }
    };
    /**
     * DELETE /api/admin/characters/:id
     * Delete a character
     */
    deleteCharacter = async (req, res) => {
        try {
            const { id } = req.params;
            const result = await this.adminService.deleteCharacter(id);
            this.sendResponse(res, result);
        }
        catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Controller failed');
        }
    };
    /**
     * POST /api/admin/games/onboard
     * One-call game onboarding: creates Game + Characters + Encyclopedia + SearchStrategies + queues ingestion
     */
    onboardGame = async (req, res) => {
        try {
            const result = await this.onboardingService.onboardGame(req.body);
            this.sendResponse(res, result);
        }
        catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Onboarding failed');
        }
    };
    /**
     * GET /api/admin/games/:gameId/search-strategies
     * List all search strategies for a game
     */
    getSearchStrategies = async (req, res) => {
        try {
            const { gameId } = req.params;
            const strategies = await GameSearchStrategy_1.GameSearchStrategy.find({ game_id: gameId })
                .sort({ priority: -1, created_at: -1 }).lean();
            this.sendResponse(res, { success: true, data: strategies });
        }
        catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed');
        }
    };
    /**
     * POST /api/admin/games/:gameId/search-strategies
     * Add or replace search strategies for a game
     */
    upsertSearchStrategies = async (req, res) => {
        try {
            const { gameId } = req.params;
            const { queries, patch_version, priority = 0 } = req.body;
            if (!Array.isArray(queries) || queries.length === 0) {
                res.status(400).json({ success: false, error: 'queries array is required' });
                return;
            }
            const strategy = await GameSearchStrategy_1.GameSearchStrategy.create({
                game_id: gameId,
                queries,
                patch_version: patch_version || 'latest',
                is_active: true,
                priority,
            });
            this.sendResponse(res, { success: true, data: strategy, message: `Added ${queries.length} search queries for ${gameId}` });
        }
        catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed');
        }
    };
    /**
     * DELETE /api/admin/games/:gameId/search-strategies/:id
     * Deactivate a search strategy
     */
    deactivateSearchStrategy = async (req, res) => {
        try {
            const { id } = req.params;
            await GameSearchStrategy_1.GameSearchStrategy.findByIdAndUpdate(id, { is_active: false });
            this.sendResponse(res, { success: true, message: 'Strategy deactivated' });
        }
        catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed');
        }
    };
    /**
     * POST /api/admin/games/:gameId/patch
     * Declare a new patch — archives old chars, bumps versions, queues post-patch ingestion
     * Body: { version, changed_characters[], patch_notes_url? }
     */
    declarePatch = async (req, res) => {
        try {
            const { gameId } = req.params;
            const { version, changed_characters, patch_notes_url } = req.body;
            if (!version) {
                res.status(400).json({ success: false, error: 'version is required' });
                return;
            }
            if (!Array.isArray(changed_characters)) {
                res.status(400).json({ success: false, error: 'changed_characters array is required' });
                return;
            }
            const result = await this.patchService.declarePatch(gameId, {
                version,
                changed_characters,
                patch_notes_url,
            });
            this.sendResponse(res, result);
        }
        catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Patch declaration failed');
        }
    };
    /**
     * GET /api/admin/games/:gameId/patches
     * Get patch history for a game
     */
    getPatchHistory = async (req, res) => {
        try {
            const { gameId } = req.params;
            const result = await this.patchService.getPatchHistory(gameId);
            this.sendResponse(res, result);
        }
        catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed');
        }
    };
}
exports.AdminController = AdminController;
//# sourceMappingURL=AdminController.js.map