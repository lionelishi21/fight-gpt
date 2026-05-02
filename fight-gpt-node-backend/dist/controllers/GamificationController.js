"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GamificationController = void 0;
const BaseController_1 = require("./BaseController");
const GamificationService_1 = require("../services/GamificationService");
class GamificationController extends BaseController_1.BaseController {
    service;
    constructor() {
        super();
        this.service = new GamificationService_1.GamificationService();
    }
    /**
     * Get current user's gamification stats
     */
    getMyStats = async (req, res) => {
        try {
            // @ts-ignore - user attached by auth middleware
            const userId = req.user.id;
            const stats = await this.service.getUserStats(userId);
            this.sendResponse(res, {
                success: true,
                data: stats
            });
        }
        catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to fetch stats', 500);
        }
    };
    /**
     * Dev/Test endpoint to add XP manually
     */
    debugAddXp = async (req, res) => {
        try {
            // @ts-ignore
            const userId = req.user.id;
            const { amount } = req.body;
            if (!amount || typeof amount !== 'number') {
                this.sendError(res, 'Amount is required and must be a number', 400);
                return;
            }
            const result = await this.service.addXp(userId, amount);
            this.sendResponse(res, {
                success: true,
                data: result,
                message: `Added ${amount} XP`
            });
        }
        catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to add XP', 500);
        }
    };
}
exports.GamificationController = GamificationController;
//# sourceMappingURL=GamificationController.js.map