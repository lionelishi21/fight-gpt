"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RivalController = void 0;
const BaseController_1 = require("./BaseController");
class RivalController extends BaseController_1.BaseController {
    rivalService;
    auditLogRepository;
    constructor(rivalService, auditLogRepository) {
        super();
        this.rivalService = rivalService;
        this.auditLogRepository = auditLogRepository;
    }
    /**
     * GET /api/rivals
     * List all rivals for the logged-in user
     */
    getRivals = async (req, res) => {
        try {
            // @ts-ignore - user added by auth middleware
            const userId = req.user.id;
            const result = await this.rivalService.getRivalsByUser(userId);
            this.sendResponse(res, result);
        }
        catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to fetch rivals', 500);
        }
    };
    /**
     * POST /api/rivals
     * Add a new rival target
     */
    addRival = async (req, res) => {
        try {
            // @ts-ignore - user added by auth middleware
            const userId = req.user.id;
            const { name, gameId, targetCharacterId } = req.body;
            if (!name || !gameId) {
                this.sendError(res, 'Name and gameId are required', 400);
                return;
            }
            const result = await this.rivalService.createRival(userId, name, gameId, targetCharacterId);
            this.sendResponse(res, result, result.success ? 201 : 400);
        }
        catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to add rival', 500);
        }
    };
    /**
     * DELETE /api/rivals/:id
     * Remove a rival target
     */
    deleteRival = async (req, res) => {
        try {
            // @ts-ignore - user added by auth middleware
            const userId = req.user.id;
            const rivalId = req.params.id;
            const result = await this.rivalService.deleteRival(userId, rivalId);
            this.sendResponse(res, result, result.success ? 200 : 404);
        }
        catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to delete rival', 500);
        }
    };
}
exports.RivalController = RivalController;
exports.default = RivalController;
//# sourceMappingURL=RivalController.js.map