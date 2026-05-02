import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { IUserService } from '../services/UserService';
import { IAuditLogRepository } from '../repositories/AuditLogRepository';
export declare class UserController extends BaseController {
    private readonly userService;
    private readonly auditLogRepository?;
    constructor(userService: IUserService, auditLogRepository?: IAuditLogRepository);
    /**
     * PATCH /api/users/slots/active
     * Switch the active combat slot index
     */
    switchActiveSlot: (req: Request, res: Response) => Promise<void>;
    /**
     * PATCH /api/users/slots/:index
     * Update configuration for a specific combat slot
     */
    updateSlot: (req: Request, res: Response) => Promise<void>;
    /**
     * GET /api/users/me
     * Get the simplified current user profile (for HUD sync)
     */
    getMe: (req: Request, res: Response) => Promise<void>;
    /**
     * POST /api/users/push-token
     * Register an FCM push notification token for the user
     */
    registerPushToken: (req: Request, res: Response) => Promise<void>;
}
export default UserController;
//# sourceMappingURL=UserController.d.ts.map