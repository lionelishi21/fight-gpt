import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { IAdminService } from '../services/AdminService';
import { IIngestionService } from '../services/IngestionService';
import { IMetaService } from '../services/MetaService';
import { AutoResearchService } from '../services/AutoResearchService';
import { ITrendAnalysisService } from '../services/TrendAnalysisService';
import User from '../models/User';
import { Game } from '../models/Game';
import { CharacterEncyclopediaRepository } from '../repositories/CharacterEncyclopediaRepository';
import { TheoryRepository } from '../repositories/TheoryRepository';
import { Scenario } from '../models/Scenario';
import { Character } from '../models/Character';
import { GameSearchStrategy } from '../models/GameSearchStrategy';
import { GameOnboardingService } from '../services/GameOnboardingService';
import { PatchService } from '../services/PatchService';
import { RosterSyncService } from '../services/RosterSyncService';
import { GameScanService, DeepScanResult } from '../services/GameScanService';
import { AnalysisCorrection } from '../models/AnalysisCorrection';
import { Analysis } from '../models/Analysis';
import { ResearchLog } from '../models/ResearchLog';
import { SystemSettings } from '../models/SystemSettings';
import fs from 'fs';
import path from 'path';

export class AdminController extends BaseController {
    private readonly onboardingService: GameOnboardingService;
    private readonly patchService: PatchService;
    private readonly rosterSyncService?: RosterSyncService;
    private readonly gameScanService: GameScanService;

    constructor(
        private readonly adminService: IAdminService,
        private readonly ingestionService?: IIngestionService,
        private readonly metaService?: IMetaService,
        private readonly autoResearchService?: AutoResearchService,
        private readonly trendAnalysisService?: ITrendAnalysisService,
        rosterSyncService?: RosterSyncService,
    ) {
        super();
        this.onboardingService = new GameOnboardingService(ingestionService);
        this.patchService = new PatchService(ingestionService);
        this.rosterSyncService = rosterSyncService;
        this.gameScanService = new GameScanService();
    }

    /**
     * GET /api/admin/stats
     * Get system health and queue status
     */
    getSystemStats = async (req: Request, res: Response): Promise<void> => {
        try {
            const result = await this.adminService.getSystemStats();
            this.sendResponse(res, result);
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Controller failed');
        }
    };

    /**
     * GET /api/admin/settings
     * Retrieve system settings (active AI provider, grok fallback status)
     */
    getSystemSettings = async (req: Request, res: Response): Promise<void> => {
        try {
            const settings = await SystemSettings.getSettings();
            this.sendResponse(res, { success: true, data: settings });
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to fetch settings');
        }
    };

    /**
     * PUT /api/admin/settings
     * Update system settings (toggle active provider or fallback)
     */
    updateSystemSettings = async (req: Request, res: Response): Promise<void> => {
        try {
            const { active_ai_provider, grok_fallback_enabled, bedrock_fallback_enabled, monthly_global_limit } = req.body;
            const settings = await SystemSettings.getSettings();
            
            if (active_ai_provider !== undefined) {
                if (!['gemini', 'grok', 'bedrock'].includes(active_ai_provider)) {
                    this.sendError(res, 'active_ai_provider must be "gemini", "grok", or "bedrock"', 400);
                    return;
                }
                settings.active_ai_provider = active_ai_provider;
            }
            
            if (grok_fallback_enabled !== undefined) {
                settings.grok_fallback_enabled = !!grok_fallback_enabled;
            }

            if (bedrock_fallback_enabled !== undefined) {
                settings.bedrock_fallback_enabled = !!bedrock_fallback_enabled;
            }

            if (monthly_global_limit !== undefined) {
                const limitVal = parseInt(monthly_global_limit);
                if (isNaN(limitVal) || limitVal < 1) {
                    this.sendError(res, 'monthly_global_limit must be a positive integer', 400);
                    return;
                }
                settings.monthly_global_limit = limitVal;
            }
            
            await settings.save();
            this.sendResponse(res, { success: true, data: settings, message: 'Settings updated successfully' });
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to update settings');
        }
    };

    /**
     * GET /api/admin/coverage
     * Show CharacterEncyclopedia coverage per game — how many characters have
     * encyclopedia entries vs how many characters are seeded. Low coverage means
     * move-name validation and few-shot context will silently degrade.
     */
    /**
     * POST /api/admin/ingestion/trigger-character
     * Queue ingestion jobs targeted at a specific character to balance scenario coverage.
     */
    triggerCharacterIngestion = async (req: Request, res: Response): Promise<void> => {
        try {
            const { gameId, characterName } = req.body;
            if (!gameId || !characterName) {
                this.sendError(res, 'gameId and characterName are required', 400);
                return;
            }
            if (!this.ingestionService) {
                this.sendError(res, 'IngestionService not available', 503);
                return;
            }

            const gameShortMap: Record<string, string> = {
                sf6: 'SF6', tekken8: 'Tekken 8', ggst: 'Guilty Gear Strive',
                mk1: 'Mortal Kombat 1', dbfz: 'DBFZ', mvc3: 'UMVC3',
            };
            const gameShort = gameShortMap[gameId] || gameId.toUpperCase();

            // Inject two targeted queries for this character directly into ingestion
            // by temporarily adding them to the game's search strategy
            const queries = [
                `${gameShort} ${characterName} ranked match high level gameplay 2025`,
                `${gameShort} ${characterName} tournament match pro player 2025`,
                `${gameShort} ${characterName} combo guide frame data match footage`,
            ];

            let totalQueued = 0;
            for (const q of queries) {
                const res2 = await this.ingestionService.triggerIngestion(gameId, 5);
                if (res2.success && res2.data) totalQueued += res2.data.queued_count;
            }

            this.sendResponse(res, {
                success: true,
                data: { gameId, characterName, queries, queued: totalQueued },
                message: `Queued targeted ingestion for ${characterName} in ${gameId}`,
            });
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Trigger failed', 500);
        }
    };

    /**
     * GET /api/admin/theory/staging?status=pending
     * Returns theories filtered by status for the staging/moderation queue.
     */
    getStagingTheories = async (req: Request, res: Response): Promise<void> => {
        try {
            const status = (req.query.status as string) || 'pending';
            const limit = parseInt(req.query.limit as string) || 100;
            const theoryRepo = new TheoryRepository();
            const theories = await theoryRepo.findByStatus(status, limit);
            this.sendResponse(res, { success: true, data: theories });
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to fetch staging theories', 500);
        }
    };

    /**
     * PATCH /api/admin/theory/:id/status
     * Approve or reject a theory document, optionally updating its full_theory content.
     */
    updateTheoryStatus = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const { status, full_theory } = req.body;
            if (!['approved', 'rejected'].includes(status)) {
                this.sendError(res, 'status must be "approved" or "rejected"', 400);
                return;
            }
            const theoryRepo = new TheoryRepository();
            const updated = await theoryRepo.updateStatus(id, status, full_theory);
            if (!updated) {
                this.sendError(res, 'Theory not found', 404);
                return;
            }
            this.sendResponse(res, { success: true, data: updated });
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to update theory status', 500);
        }
    };

    // ─── Scenario Vector DB Cleanup ────────────────────────────────────────────

    /**
     * Patterns that identify scenarios created from non-gameplay video content.
     * These corrupt the vector index — every future few-shot injection gets polluted.
     */
    private readonly GARBAGE_SCENARIO_PATTERNS = [
        // Streamer / IRL / personal content
        'streamer', 'wedding', 'marriage', 'personal life', 'discussing personal',
        'character select screen', 'talking about', 'announces', 'interview',
        'podcast', 'just chatting', 'irl stream', 'cooking', 'unboxing',
        // Non-match states
        'loading screen', 'menu', 'character select', 'main menu',
        // Non-FGC content signals
        'youtube channel', 'subscriber', 'donation', 'sponsor',
    ];

    /**
     * GET /api/admin/scenarios/garbage-count
     * Count how many scenarios in the vector DB are non-gameplay content.
     * Run this first to understand the scope before purging.
     */
    countGarbageScenarios = async (_req: Request, res: Response): Promise<void> => {
        try {
            const orConditions = this.GARBAGE_SCENARIO_PATTERNS.map(p => ({
                $or: [
                    { description: { $regex: p, $options: 'i' } },
                    { context:     { $regex: p, $options: 'i' } },
                ],
            }));

            const garbageCount = await Scenario.countDocuments({ $or: orConditions });
            const totalCount   = await Scenario.countDocuments({});

            this.sendResponse(res, {
                success: true,
                data: {
                    garbage: garbageCount,
                    total:   totalCount,
                    clean:   totalCount - garbageCount,
                    pct_garbage: totalCount > 0 ? `${((garbageCount / totalCount) * 100).toFixed(1)}%` : '0%',
                    patterns_checked: this.GARBAGE_SCENARIO_PATTERNS.length,
                },
            });
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Count failed', 500);
        }
    };

    /**
     * POST /api/admin/scenarios/purge-garbage
     * Delete all non-gameplay scenarios from the vector DB.
     * This is DESTRUCTIVE — run countGarbageScenarios first to check scope.
     * Safe to run multiple times (idempotent).
     */
    purgeGarbageScenarios = async (_req: Request, res: Response): Promise<void> => {
        try {
            const orConditions = this.GARBAGE_SCENARIO_PATTERNS.map(p => ({
                $or: [
                    { description: { $regex: p, $options: 'i' } },
                    { context:     { $regex: p, $options: 'i' } },
                ],
            }));

            const before = await Scenario.countDocuments({});
            const result = await Scenario.deleteMany({ $or: orConditions });
            const after  = await Scenario.countDocuments({});

            this.sendResponse(res, {
                success: true,
                data: {
                    deleted:    result.deletedCount,
                    remaining:  after,
                    before:     before,
                    message: `Purged ${result.deletedCount} non-gameplay scenarios. ${after} clean scenarios remain.`,
                },
            });
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Purge failed', 500);
        }
    };

    getEncyclopediaCoverage = async (_req: Request, res: Response): Promise<void> => {
        try {
            const encyclopediaRepo = new CharacterEncyclopediaRepository();
            const games = await Game.find({ is_active: true }).lean();

            const coverage = await Promise.all(games.map(async (game) => {
                const [charCount, encCount] = await Promise.all([
                    Character.countDocuments({ game_id: game.game_id }),
                    encyclopediaRepo.countByGameId(game.game_id),
                ]);
                return {
                    game_id: game.game_id,
                    game_name: (game as any).name,
                    characters: charCount,
                    encyclopedia_entries: encCount,
                    coverage_pct: charCount > 0 ? Math.round((encCount / charCount) * 100) : 0,
                    status: encCount === 0 ? 'empty' : encCount < charCount ? 'partial' : 'full',
                };
            }));

            this.sendResponse(res, { success: true, data: coverage });
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Coverage check failed');
        }
    };

    /**
     * GET /api/admin/coverage/:gameId
     * Per-character breakdown: encyclopedia entry present + scenario count in vector DB.
     * Sorted by scenario count ascending so the most under-represented characters appear first.
     */
    getCharacterCoverage = async (req: Request, res: Response): Promise<void> => {
        try {
            const { gameId } = req.params;
            const encyclopediaRepo = new CharacterEncyclopediaRepository();

            const [characters, encEntries] = await Promise.all([
                Character.find({ game_id: gameId }).select('character_id name').lean(),
                encyclopediaRepo.findMany({ game_id: gameId.toLowerCase() }),
            ]);

            if (!characters.length) {
                this.sendError(res, `No characters found for game "${gameId}"`, 404);
                return;
            }

            const encSet = new Set(encEntries.map((e: any) => e.character_id?.toLowerCase()));

            // Count scenarios per character in one aggregation (avoids N queries)
            const scenarioCounts: { _id: string; count: number }[] = await Scenario.aggregate([
                { $match: { game_id: gameId } },
                { $unwind: '$characters_involved' },
                { $group: { _id: { $toLower: '$characters_involved' }, count: { $sum: 1 } } },
            ]);
            const scenarioMap = new Map(scenarioCounts.map(s => [s._id, s.count]));

            const rows = characters.map((char: any) => {
                const charId = (char.character_id || '').toLowerCase();
                const scenarios = scenarioMap.get(charId) || 0;
                const hasEncyclopedia = encSet.has(charId);
                let status: string;
                if (!hasEncyclopedia && scenarios === 0) status = 'critical';
                else if (!hasEncyclopedia) status = 'no_encyclopedia';
                else if (scenarios < 10) status = 'low_scenarios';
                else if (scenarios < 30) status = 'partial';
                else status = 'good';

                return {
                    character_id: charId,
                    name: char.name || char.character_id,
                    has_encyclopedia: hasEncyclopedia,
                    scenarios,
                    status,
                };
            });

            // Worst coverage first
            rows.sort((a, b) => {
                const statusOrder = { critical: 0, no_encyclopedia: 1, low_scenarios: 2, partial: 3, good: 4 };
                return (statusOrder[a.status as keyof typeof statusOrder] ?? 5) -
                       (statusOrder[b.status as keyof typeof statusOrder] ?? 5) ||
                       a.scenarios - b.scenarios;
            });

            const summary = {
                total: rows.length,
                critical: rows.filter(r => r.status === 'critical').length,
                no_encyclopedia: rows.filter(r => r.status === 'no_encyclopedia').length,
                low_scenarios: rows.filter(r => r.status === 'low_scenarios').length,
                partial: rows.filter(r => r.status === 'partial').length,
                good: rows.filter(r => r.status === 'good').length,
            };

            this.sendResponse(res, { success: true, data: { game_id: gameId, summary, characters: rows } });
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Character coverage check failed');
        }
    };

    /**
     * POST /api/admin/trends/analyze
     * Trigger a manual Meta-Shift analysis check
     */
    triggerTrendAnalysis = async (req: Request, res: Response): Promise<void> => {
        try {
            if (!this.trendAnalysisService) {
                this.sendError(res, 'TrendAnalysisService not configured');
                return;
            }
            await this.trendAnalysisService.analyzeMetaShifts();
            this.sendResponse(res, { success: true, message: 'Meta-Shift analysis triggered' });
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Controller failed');
        }
    };

    /**
     * GET /api/admin/jobs
     * List recent ingestion jobs
     */
    getRecentJobs = async (req: Request, res: Response): Promise<void> => {
        try {
            const limit = parseInt(req.query.limit as string) || 20;
            const status = req.query.status as string;
            const gameId = req.query.gameId as string;
            const result = await this.adminService.getIngestionJobs(limit, status, gameId);
            this.sendResponse(res, result);
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Controller failed');
        }
    };

    /**
     * GET /api/admin/analyses
     * List recent analyses
     */
    getRecentAnalyses = async (req: Request, res: Response): Promise<void> => {
        try {
            const limit = parseInt(req.query.limit as string) || 20;
            const offset = parseInt(req.query.offset as string) || 0;
            const gameId = req.query.gameId as string;
            const search = req.query.search as string;
            const result = await this.adminService.getAnalyses(limit, offset, gameId, search);
            this.sendResponse(res, result);
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Controller failed');
        }
    };

    /**
     * DELETE /api/admin/analyses/:id
     * Delete a specific analysis
     */
    deleteAnalysis = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            if (!id) {
                res.status(400).json({ success: false, error: 'id is required' });
                return;
            }
            const result = await this.adminService.deleteAnalysis(id);
            this.sendResponse(res, result);
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Controller failed');
        }
    };

    /**
     * POST /api/admin/jobs/retry
     * Force retry a failed job
     */
    retryJob = async (req: Request, res: Response): Promise<void> => {
        try {
            const { jobId } = req.body;
            if (!jobId) {
                res.status(400).json({ success: false, error: 'jobId is required' });
                return;
            }
            const result = await this.adminService.retryJob(jobId);
            this.sendResponse(res, result);
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Controller failed');
        }
    };

    /**
     * POST /api/admin/analyses/:id/reanalyze
     * Force re-analysis of a specific record
     */
    reanalyzeAnalysis = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            if (!id) {
                res.status(400).json({ success: false, error: 'id is required' });
                return;
            }
            const result = await this.adminService.reanalyzeAnalysis(id);
            this.sendResponse(res, result);
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Controller failed');
        }
    };

    /**
     * POST /api/admin/ingestion/trigger
     * Manually trigger analysis for a specific URL
     */
    triggerManualUrl = async (req: Request, res: Response): Promise<void> => {
        try {
            const { gameId, youtubeUrl } = req.body;
            if (!gameId || !youtubeUrl) {
                res.status(400).json({ success: false, error: 'gameId and youtubeUrl are required' });
                return;
            }
            const result = await this.adminService.triggerManualUrl(gameId, youtubeUrl);
            this.sendResponse(res, result);
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Controller failed');
        }
    };

    /**
     * GET /api/admin/users
     * List all users with tier, role, slots, gamification
     */
    getUsers = async (req: Request, res: Response): Promise<void> => {
        try {
            const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
            const offset = parseInt(req.query.offset as string) || 0;
            const search = req.query.search as string;

            const filter: any = {};
            if (search) {
                filter.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } },
                ];
            }

            const [users, total] = await Promise.all([
                User.find(filter)
                    .select('-password')
                    .sort({ createdAt: -1 })
                    .skip(offset)
                    .limit(limit)
                    .lean(),
                User.countDocuments(filter),
            ]);

            this.sendResponse(res, { success: true, data: { users, total, limit, offset } });
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to fetch users');
        }
    };

    /**
     * GET /api/admin/games
     * List all games (active + inactive)
     */
    getGames = async (req: Request, res: Response): Promise<void> => {
        try {
            const games = await Game.find({}).sort({ is_active: -1, name: 1 }).lean();
            this.sendResponse(res, { success: true, data: games });
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to fetch games');
        }
    };

    /**
     * POST /api/admin/games
     * Create a new game
     */
    createGame = async (req: Request, res: Response): Promise<void> => {
        try {
            const { game_id, name, full_name, publisher, developer, description, platform, genre, latest_version, is_active } = req.body;
            if (!game_id || !name) {
                res.status(400).json({ success: false, error: 'game_id and name are required' });
                return;
            }
            const existing = await Game.findOne({ game_id: game_id.toLowerCase() });
            if (existing) {
                res.status(409).json({ success: false, error: `Game with id "${game_id}" already exists` });
                return;
            }
            const game = await Game.create({
                game_id: game_id.toLowerCase().trim(),
                name, full_name, publisher, developer, description,
                platform: platform || [],
                genre: genre || 'Fighting',
                latest_version,
                is_active: is_active !== undefined ? is_active : false,
            });
            this.sendResponse(res, { success: true, data: game });
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to create game');
        }
    };

    /**
     * PATCH /api/admin/games/:gameId/status
     * Toggle game active/inactive (current/soon)
     */
    setGameStatus = async (req: Request, res: Response): Promise<void> => {
        try {
            const { gameId } = req.params;
            const { is_active } = req.body;
            if (typeof is_active !== 'boolean') {
                res.status(400).json({ success: false, error: 'is_active (boolean) is required' });
                return;
            }
            const game = await Game.findOneAndUpdate(
                { game_id: gameId },
                { is_active },
                { new: true }
            );
            if (!game) {
                res.status(404).json({ success: false, error: 'Game not found' });
                return;
            }
            this.sendResponse(res, { success: true, data: game });
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to update game status');
        }
    };

    /**
     * PUT /api/admin/games/:gameId
     * Update game fields
     */
    updateGame = async (req: Request, res: Response): Promise<void> => {
        try {
            const { gameId } = req.params;
            const allowed = ['name', 'full_name', 'publisher', 'developer', 'description', 'platform', 'genre', 'latest_version', 'icon_url', 'banner_url'];
            const updates: any = {};
            allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
            const game = await Game.findOneAndUpdate({ game_id: gameId }, updates, { new: true });
            if (!game) {
                res.status(404).json({ success: false, error: 'Game not found' });
                return;
            }
            this.sendResponse(res, { success: true, data: game });
        } catch (error) {
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
    bumpEncyclopediaPatch = async (req: Request, res: Response): Promise<void> => {
        try {
            const { gameId } = req.params;
            const { patch_version } = req.body;
            if (!patch_version) {
                res.status(400).json({ success: false, error: 'patch_version is required' });
                return;
            }

            // Update the game's current patch label
            const game = await Game.findOneAndUpdate(
                { game_id: gameId },
                { latest_version: patch_version },
                { new: true }
            );
            if (!game) {
                res.status(404).json({ success: false, error: 'Game not found' });
                return;
            }

            // Bump encyclopedia for every character in this game
            const encyclopediaRepo = new CharacterEncyclopediaRepository();
            const characters = await Character.find({ game_id: gameId, is_current: true }).lean().exec();

            const results = await Promise.allSettled(
                characters.map((c: any) =>
                    encyclopediaRepo.bumpPatchVersion(gameId, c.character_id || c._id.toString(), patch_version)
                )
            );

            const bumped = results.filter(r => r.status === 'fulfilled').length;
            const failed = results.filter(r => r.status === 'rejected').length;

            this.sendResponse(res, {
                success: true,
                data: { game_id: gameId, patch_version, bumped, failed },
            });
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to bump patch version');
        }
    };

    /**
     * POST /api/admin/research/trigger
     * Manually run the Karpathy auto-research cycle without waiting for the 2am cron
     */
    triggerResearch = async (req: Request, res: Response): Promise<void> => {
        if (!this.autoResearchService) {
            res.status(503).json({ success: false, error: 'Auto-research service unavailable' });
            return;
        }
        try {
            const gameId = req.body?.game_id || 'all';
            const startedAt = Date.now();

            // Run in background, write a ResearchLog when done
            this.autoResearchService.runResearchCycle().then(async (result: any) => {
                await ResearchLog.create({
                    game_id:             gameId,
                    triggered_by:        'manual',
                    scenarios_generated: result?.scenariosGenerated ?? 0,
                    theories_generated:  result?.theoriesGenerated ?? 0,
                    characters_covered:  result?.charactersCovered ?? [],
                    videos_processed:    result?.videosProcessed ?? 0,
                    errors:              [],
                    duration_ms:         Date.now() - startedAt,
                    status:              'success',
                });
            }).catch(async (err: any) => {
                console.error('[AdminController] Background research cycle failed:', err);
                await ResearchLog.create({
                    game_id:      gameId,
                    triggered_by: 'manual',
                    errors:       [err?.message || String(err)],
                    duration_ms:  Date.now() - startedAt,
                    status:       'failed',
                }).catch(() => {});
            });

            this.sendResponse(res, {
                success: true,
                message: 'Research cycle triggered in background. Results will appear in the Research Log.',
            });
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Research cycle trigger failed');
        }
    };

    /** GET /admin/research/logs — last 20 research runs */
    getResearchLogs = async (req: Request, res: Response): Promise<void> => {
        try {
            const { game_id, limit = 20 } = req.query;
            const filter: any = {};
            if (game_id) filter.game_id = game_id;
            const logs = await ResearchLog.find(filter)
                .sort({ run_at: -1 })
                .limit(Number(limit))
                .lean();
            this.sendResponse(res, { success: true, data: logs });
        } catch (err) {
            this.sendError(res, err instanceof Error ? err.message : 'Failed to fetch research logs');
        }
    };

    /**
     * POST /api/admin/ingestion/seed
     * Bulk queue an array of known tournament YouTube URLs — bypasses yt-dlp search
     * Body: { gameId: string, youtubeUrls: string[] }
     */
    seedUrls = async (req: Request, res: Response): Promise<void> => {
        try {
            const { gameId, youtubeUrls } = req.body;
            if (!gameId || !Array.isArray(youtubeUrls) || youtubeUrls.length === 0) {
                res.status(400).json({ success: false, error: 'gameId and youtubeUrls[] are required' });
                return;
            }
            const result = await this.adminService.seedUrls(gameId, youtubeUrls);
            this.sendResponse(res, result);
        } catch (error) {
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
    seedAndProcess = async (req: Request, res: Response): Promise<void> => {
        if (!this.ingestionService) {
            res.status(503).json({ success: false, error: 'Ingestion service unavailable' });
            return;
        }

        try {
            const {
                game_id,
                youtube_urls,
                max_videos = 5,
                batch_size = 3,
                generate_meta = false,
            } = req.body as {
                game_id: string;
                youtube_urls?: string[];
                max_videos?: number;
                batch_size?: number;
                generate_meta?: boolean;
            };

            if (!game_id) {
                res.status(400).json({ success: false, error: 'game_id is required' });
                return;
            }

            // Step 1 — queue videos
            let queueResult: { queued_count?: number; queued?: number; skipped_count?: number; skipped?: number };
            if (Array.isArray(youtube_urls) && youtube_urls.length > 0) {
                const r = await this.adminService.seedUrls(game_id, youtube_urls);
                queueResult = { queued_count: r.data?.queued, skipped_count: r.data?.skipped };
            } else {
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
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Controller failed');
        }
    };

    /**
     * GET /api/admin/characters
     * List characters (optionally filtered by gameId)
     */
    getCharacters = async (req: Request, res: Response): Promise<void> => {
        try {
            const gameId = req.query.gameId as string;
            const result = await this.adminService.getCharacters(gameId);
            this.sendResponse(res, result);
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Controller failed');
        }
    };

    /**
     * POST /api/admin/characters
     * Create a new character
     */
    createCharacter = async (req: Request, res: Response): Promise<void> => {
        try {
            const result = await this.adminService.createCharacter(req.body);
            this.sendResponse(res, result);
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Controller failed');
        }
    };

    /**
     * PATCH /api/admin/characters/:id
     * Update character metadata
     */
    updateCharacter = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const result = await this.adminService.updateCharacter(id, req.body);
            this.sendResponse(res, result);
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Controller failed');
        }
    };

    /**
     * DELETE /api/admin/characters/:id
     * Delete a character
     */
    deleteCharacter = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const result = await this.adminService.deleteCharacter(id);
            this.sendResponse(res, result);
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Controller failed');
        }
    };

    /**
     * POST /api/admin/games/onboard
     * One-call game onboarding: creates Game + Characters + Encyclopedia + SearchStrategies + queues ingestion
     */
    onboardGame = async (req: Request, res: Response): Promise<void> => {
        try {
            const result = await this.onboardingService.onboardGame(req.body);
            this.sendResponse(res, result);
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Onboarding failed');
        }
    };

    /**
     * GET /api/admin/games/:gameId/search-strategies
     * List all search strategies for a game
     */
    getSearchStrategies = async (req: Request, res: Response): Promise<void> => {
        try {
            const { gameId } = req.params;
            const strategies = await GameSearchStrategy.find({ game_id: gameId })
                .sort({ priority: -1, created_at: -1 }).lean();
            this.sendResponse(res, { success: true, data: strategies });
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed');
        }
    };

    /**
     * POST /api/admin/games/:gameId/search-strategies
     * Add or replace search strategies for a game
     */
    upsertSearchStrategies = async (req: Request, res: Response): Promise<void> => {
        try {
            const { gameId } = req.params;
            const { queries, patch_version, priority = 0 } = req.body as {
                queries: string[];
                patch_version?: string;
                priority?: number;
            };
            if (!Array.isArray(queries) || queries.length === 0) {
                res.status(400).json({ success: false, error: 'queries array is required' });
                return;
            }
            const strategy = await GameSearchStrategy.create({
                game_id: gameId,
                queries,
                patch_version: patch_version || 'latest',
                is_active: true,
                priority,
            });
            this.sendResponse(res, { success: true, data: strategy, message: `Added ${queries.length} search queries for ${gameId}` });
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed');
        }
    };

    /**
     * DELETE /api/admin/games/:gameId/search-strategies/:id
     * Deactivate a search strategy
     */
    deactivateSearchStrategy = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            await GameSearchStrategy.findByIdAndUpdate(id, { is_active: false });
            this.sendResponse(res, { success: true, message: 'Strategy deactivated' });
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed');
        }
    };

    /**
     * POST /api/admin/games/:gameId/patch
     * Declare a new patch — archives old chars, bumps versions, queues post-patch ingestion
     * Body: { version, changed_characters[], patch_notes_url? }
     */
    declarePatch = async (req: Request, res: Response): Promise<void> => {
        try {
            const { gameId } = req.params;
            const { version, changed_characters, patch_notes_url } = req.body as {
                version: string;
                changed_characters: string[];
                patch_notes_url?: string;
            };
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
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Patch declaration failed');
        }
    };

    /**
     * GET /api/admin/games/:gameId/patches
     * Get patch history for a game
     */
    getPatchHistory = async (req: Request, res: Response): Promise<void> => {
        try {
            const { gameId } = req.params;
            const result = await this.patchService.getPatchHistory(gameId);
            this.sendResponse(res, result);
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed');
        }
    };
    
    /**
     * POST /api/admin/games/:gameId/sync
     * Manually trigger roster and frame data sync for a game
     */
    syncGameData = async (req: Request, res: Response): Promise<void> => {
        if (!this.rosterSyncService) {
            res.status(503).json({ success: false, error: 'Roster sync service unavailable' });
            return;
        }

        try {
            const { gameId } = req.params;
            const fullSync = req.query.fullSync === 'true';
            
            if (!gameId) {
                res.status(400).json({ success: false, error: 'gameId is required' });
                return;
            }

            // Run in background for SF6 as it takes a while if fullSync is true
            if (gameId === 'sf6' && fullSync) {
                this.rosterSyncService.syncRoster(gameId, true).catch(err => {
                    console.error(`[AdminController] Background sync failed for ${gameId}:`, err);
                });
                
                this.sendResponse(res, { 
                    success: true, 
                    message: `Full sync triggered in background for ${gameId}. This may take several minutes.` 
                });
            } else {
                const result = await this.rosterSyncService.syncRoster(gameId, fullSync);
                this.sendResponse(res, { success: true, data: result });
            }
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Sync failed');
        }
    };

    /**
     * POST /api/admin/ingestion/bulk-queue
     * Enqueues all 660 pending MongoDB jobs into BullMQ so the worker drains
     * them automatically at 5/min. Safe to call repeatedly — deduped by job_id.
     */
    bulkQueuePending = async (req: Request, res: Response): Promise<void> => {
        if (!this.ingestionService) {
            res.status(503).json({ success: false, error: 'Ingestion service unavailable' });
            return;
        }
        try {
            const gameId = req.query.gameId as string | undefined;
            const result = await (this.ingestionService as any).bulkQueuePending(gameId);
            this.sendResponse(res, {
                success: true,
                data: result,
                message: `Queued ${result.queued} jobs into worker. Processing at 5/min — check worker logs for progress.`,
            });
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Bulk queue failed');
        }
    };

    /**
     * POST /api/admin/games/:gameId/scan
     * Gemini-powered scan — auto-discovers current patch version + full roster + frame data.
     * Upserts all characters with no duplication. No manual input required.
     */
    scanGame = async (req: Request, res: Response): Promise<void> => {
        try {
            const { gameId } = req.params;
            if (!gameId) {
                res.status(400).json({ success: false, error: 'gameId is required' });
                return;
            }
            const result = await this.gameScanService.scanGame(gameId);
            this.sendResponse(res, { success: true, data: result });
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Scan failed');
        }
    };

    /**
     * POST /api/admin/games/:gameId/deepscan
     * Phase 2 scan — Gemini generates complete moveset (all normals/specials/supers) +
     * practical combos for every character. Runs per-character. Can take several minutes.
     * Always runs in background and returns immediately.
     */
    deepScanGame = async (req: Request, res: Response): Promise<void> => {
        try {
            const { gameId } = req.params;
            if (!gameId) {
                res.status(400).json({ success: false, error: 'gameId is required' });
                return;
            }

            // Fire in background — can take minutes for a full roster
            this.gameScanService.deepScanGame(gameId).then((result: DeepScanResult) => {
                console.log(`[AdminController] Deep scan complete for ${gameId}:`, result);
            }).catch((err: Error) => {
                console.error(`[AdminController] Deep scan failed for ${gameId}:`, err.message);
            });

            this.sendResponse(res, {
                success: true,
                message: `Deep scan started for ${gameId}. Gemini is generating full moveset + combos for all characters. Check logs for progress.`,
            });
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Deep scan failed');
        }
    };

    /**
     * POST /api/admin/settings/cookie
     * Upload a new cookies.txt file for YouTube ingestion
     */
    uploadCookies = async (req: Request, res: Response): Promise<void> => {
        try {
            if (!req.file) {
                res.status(400).json({ success: false, error: 'No cookie file uploaded' });
                return;
            }

            const uploadsDir = path.join(process.cwd(), 'uploads');
            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
            }

            const targetPath = path.join(uploadsDir, 'cookies.txt');
            
            // Move uploaded file to cookies.txt
            fs.renameSync(req.file.path, targetPath);

            this.sendResponse(res, { 
                success: true, 
                message: 'YouTube cookies successfully updated.' 
            });
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to update cookies');
        }
    };

    /**
     * GET /api/admin/settings/cookie/status
     * Check if a cookies.txt file exists and its status
     */
    getCookieStatus = async (_req: Request, res: Response): Promise<void> => {
        try {
            const cookiePath = path.join(process.cwd(), 'uploads', 'cookies.txt');
            
            if (!fs.existsSync(cookiePath)) {
                this.sendResponse(res, { 
                    success: true, 
                    data: { exists: false, message: 'No cookies.txt file found on server.' } 
                });
                return;
            }

            const stats = fs.statSync(cookiePath);
            const content = fs.readFileSync(cookiePath, 'utf8');
            const isNetscape = content.includes('# Netscape HTTP Cookie File');

            this.sendResponse(res, {
                success: true,
                data: {
                    exists: true,
                    size: stats.size,
                    updatedAt: stats.mtime,
                    isNetscape,
                    message: isNetscape
                        ? 'Valid Netscape cookie file detected.'
                        : 'File found but may not be in valid Netscape format.'
                }
            });
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to check cookie status');
        }
    };

    // ── Analysis Corrections ─────────────────────────────────────────────────

    /** GET /admin/analysis/:id/corrections */
    getAnalysisCorrections = async (req: Request, res: Response): Promise<void> => {
        try {
            const corrections = await AnalysisCorrection.find({ analysis_id: req.params.id })
                .sort({ created_at: -1 }).lean();
            this.sendResponse(res, { success: true, data: corrections });
        } catch (err) {
            this.sendError(res, err instanceof Error ? err.message : 'Failed to fetch corrections');
        }
    };

    /** POST /admin/analysis/:id/corrections */
    addAnalysisCorrection = async (req: Request, res: Response): Promise<void> => {
        try {
            const admin = (req as any).user;
            const {
                event_node_id, timestamp,
                original_event_type, original_description,
                original_move_used, original_outcome,
                correction,
                corrected_event_type, corrected_move_used, corrected_outcome,
            } = req.body;

            if (!event_node_id || !correction) {
                res.status(400).json({ success: false, error: 'event_node_id and correction are required' });
                return;
            }

            // Resolve game_id and characters from the Analysis record
            const analysis = await Analysis.findOne({
                $or: [{ _id: req.params.id }, { analysis_id: req.params.id }],
            }).lean() as any;

            const doc = await AnalysisCorrection.create({
                analysis_id:          req.params.id,
                event_node_id,
                timestamp:            timestamp || '',
                game_id:              analysis?.game_id || 'unknown',
                p1_character:         analysis?.analysis?.p1_character,
                p2_character:         analysis?.analysis?.p2_character,
                original_event_type:  original_event_type || '',
                original_description: original_description || '',
                original_move_used,
                original_outcome,
                correction,
                corrected_event_type,
                corrected_move_used,
                corrected_outcome,
                admin_id:   admin._id,
                admin_name: admin.name || admin.email,
                status:     'pending',
            });

            this.sendResponse(res, { success: true, data: doc }, 201);
        } catch (err) {
            this.sendError(res, err instanceof Error ? err.message : 'Failed to save correction');
        }
    };

    /** GET /admin/corrections — list all pending corrections across all analyses */
    listAllCorrections = async (req: Request, res: Response): Promise<void> => {
        try {
            const { status = 'pending', limit = 50 } = req.query;
            const corrections = await AnalysisCorrection.find({ status })
                .sort({ created_at: -1 })
                .limit(Number(limit))
                .lean();
            this.sendResponse(res, { success: true, data: corrections });
        } catch (err) {
            this.sendError(res, err instanceof Error ? err.message : 'Failed to list corrections');
        }
    };

    /** PATCH /admin/corrections/:correctionId — mark applied */
    markCorrectionApplied = async (req: Request, res: Response): Promise<void> => {
        try {
            const doc = await AnalysisCorrection.findByIdAndUpdate(
                req.params.correctionId,
                { status: 'applied' },
                { new: true }
            );
            if (!doc) { res.status(404).json({ success: false, error: 'Correction not found' }); return; }
            this.sendResponse(res, { success: true, data: doc });
        } catch (err) {
            this.sendError(res, err instanceof Error ? err.message : 'Failed to update correction');
        }
    };
}
