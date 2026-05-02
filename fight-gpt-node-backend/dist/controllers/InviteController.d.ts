import { Request, Response } from 'express';
import { BaseController } from './BaseController';
export declare class InviteController extends BaseController {
    /**
     * POST /admin/invites
     * Admin sends an admin-level invite to an email address
     */
    createAdminInvite: (req: Request, res: Response) => Promise<void>;
    /**
     * GET /admin/invites
     * List all admin invites
     */
    listAdminInvites: (req: Request, res: Response) => Promise<void>;
    /**
     * DELETE /admin/invites/:token
     * Revoke an invite
     */
    revokeInvite: (req: Request, res: Response) => Promise<void>;
    /**
     * GET /invites/validate/:token
     * Validate an invite token (public — used on signup page)
     */
    validateInvite: (req: Request, res: Response) => Promise<void>;
    /**
     * POST /users/referral/invite
     * Authenticated user sends a referral invite to an email
     */
    sendReferralInvite: (req: Request, res: Response) => Promise<void>;
    /**
     * GET /users/referral/stats
     * Get current user's referral stats and referees
     */
    getReferralStats: (req: Request, res: Response) => Promise<void>;
}
export declare const inviteController: InviteController;
//# sourceMappingURL=InviteController.d.ts.map