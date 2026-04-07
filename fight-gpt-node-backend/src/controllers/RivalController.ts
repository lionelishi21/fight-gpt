import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { IRivalService } from '../services/RivalService';
import { IRivalRepository } from '../repositories/RivalRepository';
import { IAuditLogRepository } from '../repositories/AuditLogRepository';

export class RivalController extends BaseController {
    constructor(
        private readonly rivalService: IRivalService,
        private readonly auditLogRepository?: IAuditLogRepository
    ) {
        super();
    }

    /**
     * GET /api/rivals
     * List all rivals for the logged-in user
     */
    public getRivals = async (req: Request, res: Response): Promise<void> => {
        try {
            // @ts-ignore - user added by auth middleware
            const userId = req.user.id;
            const result = await this.rivalService.getRivalsByUser(userId);
            this.sendResponse(res, result);
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to fetch rivals', 500);
        }
    };

    /**
     * POST /api/rivals
     * Add a new rival target
     */
    public addRival = async (req: Request, res: Response): Promise<void> => {
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
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to add rival', 500);
        }
    };

    /**
     * DELETE /api/rivals/:id
     * Remove a rival target
     */
    public deleteRival = async (req: Request, res: Response): Promise<void> => {
        try {
            // @ts-ignore - user added by auth middleware
            const userId = req.user.id;
            const rivalId = req.params.id;

            const result = await this.rivalService.deleteRival(userId, rivalId);
            this.sendResponse(res, result, result.success ? 200 : 404);
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to delete rival', 500);
        }
    };
}

export default RivalController;
