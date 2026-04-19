import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { IAdminService } from '../services/AdminService';
import User from '../models/User';
import { Game } from '../models/Game';

export class AdminController extends BaseController {
    constructor(private readonly adminService: IAdminService) {
        super();
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
     * GET /api/admin/jobs
     * List recent ingestion jobs
     */
    getRecentJobs = async (req: Request, res: Response): Promise<void> => {
        try {
            const limit = parseInt(req.query.limit as string) || 20;
            const status = req.query.status as string;
            const result = await this.adminService.getIngestionJobs(limit, status);
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
            const result = await this.adminService.getAnalyses(limit, offset);
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
}
