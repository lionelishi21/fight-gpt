import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { IRivalService } from '../services/RivalService';
import { IAuditLogRepository } from '../repositories/AuditLogRepository';
export declare class RivalController extends BaseController {
    private readonly rivalService;
    private readonly auditLogRepository?;
    constructor(rivalService: IRivalService, auditLogRepository?: IAuditLogRepository);
    /**
     * GET /api/rivals
     * List all rivals for the logged-in user
     */
    getRivals: (req: Request, res: Response) => Promise<void>;
    /**
     * POST /api/rivals
     * Add a new rival target
     */
    addRival: (req: Request, res: Response) => Promise<void>;
    /**
     * DELETE /api/rivals/:id
     * Remove a rival target
     */
    deleteRival: (req: Request, res: Response) => Promise<void>;
}
export default RivalController;
//# sourceMappingURL=RivalController.d.ts.map