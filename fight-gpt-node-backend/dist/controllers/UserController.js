"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const BaseController_1 = require("./BaseController");
class UserController extends BaseController_1.BaseController {
    userService;
    auditLogRepository;
    constructor(userService, auditLogRepository) {
        super();
        this.userService = userService;
        this.auditLogRepository = auditLogRepository;
    }
    /**
     * PATCH /api/users/slots/active
     * Switch the active combat slot index
     */
    switchActiveSlot = async (req, res) => {
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
        }
        catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to switch slot', 500);
        }
    };
    /**
     * PATCH /api/users/slots/:index
     * Update configuration for a specific combat slot
     */
    updateSlot = async (req, res) => {
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
        }
        catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to update slot', 500);
        }
    };
    /**
     * GET /api/users/me
     * Get the simplified current user profile (for HUD sync)
     */
    getMe = async (req, res) => {
        try {
            // @ts-ignore - user added by auth middleware
            const userId = req.user.id;
            const result = await this.userService.getUserProfile(userId);
            this.sendResponse(res, result);
        }
        catch (error) {
            this.sendError(res, 'Failed to fetch profile', 500);
        }
    };
    /**
     * POST /api/users/push-token
     * Register an FCM push notification token for the user
     */
    registerPushToken = async (req, res) => {
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
        }
        catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to register push token', 500);
        }
    };
    /**
     * GET /api/users/leaderboard
     * Get the global operator leaderboard
     */
    getLeaderboard = async (req, res) => {
        try {
            const limit = req.query.limit ? parseInt(req.query.limit) : 20;
            const result = await this.userService.getLeaderboard(limit);
            this.sendResponse(res, result);
        }
        catch (error) {
            this.sendError(res, 'Failed to fetch leaderboard', 500);
        }
    };
}
exports.UserController = UserController;
exports.default = UserController;
//# sourceMappingURL=UserController.js.map