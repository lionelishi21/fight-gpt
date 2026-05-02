"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EngagementController = void 0;
const BaseController_1 = require("./BaseController");
class EngagementController extends BaseController_1.BaseController {
    engagementService;
    constructor(engagementService) {
        super();
        this.engagementService = engagementService;
    }
    /**
     * POST /api/engagement/submit
     * Submit rating and comment
     */
    submit = async (req, res) => {
        try {
            const { targetId, targetType, rating, comment } = req.body;
            const userId = req.user?.id;
            if (!targetId || !targetType || !rating) {
                res.status(400).json({ success: false, error: 'targetId, targetType, and rating are required' });
                return;
            }
            const result = await this.engagementService.submitEngagement(userId, targetId, targetType, rating, comment);
            this.sendResponse(res, result);
        }
        catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Engagement submission failed');
        }
    };
    /**
     * GET /api/engagement/:targetId
     * Get stats and comments for a target
     */
    getTargetStats = async (req, res) => {
        try {
            const { targetId } = req.params;
            if (!targetId) {
                res.status(400).json({ success: false, error: 'targetId is required' });
                return;
            }
            const result = await this.engagementService.getTargetEngagement(targetId);
            this.sendResponse(res, result);
        }
        catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to fetch engagement stats');
        }
    };
}
exports.EngagementController = EngagementController;
//# sourceMappingURL=EngagementController.js.map