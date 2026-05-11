import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { IUserService } from '../services/UserService';
import { IAuditLogRepository } from '../repositories/AuditLogRepository';

export class UserController extends BaseController {
    constructor(
        private readonly userService: IUserService,
        private readonly auditLogRepository?: IAuditLogRepository
    ) {
        super();
    }

    /**
     * PATCH /api/users/slots/active
     * Switch the active combat slot index
     */
    public switchActiveSlot = async (req: Request, res: Response): Promise<void> => {
        try {
            // @ts-ignore - user added by auth middleware
            const userId = req.user.id;
            const { index } = req.body;

            if (typeof index !== 'number') {
                this.sendError(res, 'Index must be a number', 400);
                return;
            }

            const result = await this.userService.switchActiveSlot(userId, index);
            this.sendResponse(res, result);
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to switch slot', 500);
        }
    };

    /**
     * PATCH /api/users/slots/:index
     * Update configuration for a specific combat slot
     */
    public updateSlot = async (req: Request, res: Response): Promise<void> => {
        try {
            // @ts-ignore - user added by auth middleware
            const userId = req.user.id;
            const index = parseInt(req.params.index);
            const slotData = req.body;

            if (isNaN(index)) {
                this.sendError(res, 'Invalid slot index', 400);
                return;
            }

            const result = await this.userService.updateSlot(userId, index, slotData);
            this.sendResponse(res, result);
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to update slot', 500);
        }
    };

    /**
     * GET /api/users/me
     * Get the simplified current user profile (for HUD sync)
     */
    public getMe = async (req: Request, res: Response): Promise<void> => {
        try {
            // @ts-ignore - user added by auth middleware
            const userId = req.user.id;
            const result = await this.userService.getUserProfile(userId);
            this.sendResponse(res, result);
        } catch (error) {
            this.sendError(res, 'Failed to fetch profile', 500);
        }
    };

    /**
     * POST /api/users/push-token
     * Register an FCM push notification token for the user
     */
    public registerPushToken = async (req: Request, res: Response): Promise<void> => {
        try {
            // @ts-ignore - user added by auth middleware
            const userId = req.user.id;
            const { token } = req.body;

            if (!token) {
                this.sendError(res, 'Token is required', 400);
                return;
            }

            const result = await this.userService.registerPushToken(userId, token);
            this.sendResponse(res, result);
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to register push token', 500);
        }
    };

    /**
     * GET /api/users/leaderboard
     * Get the global operator leaderboard
     */
    public getLeaderboard = async (req: Request, res: Response): Promise<void> => {
        try {
            const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
            const result = await this.userService.getLeaderboard(limit);
            this.sendResponse(res, result);
        } catch (error) {
            this.sendError(res, 'Failed to fetch leaderboard', 500);
        }
    };
}

export default UserController;
