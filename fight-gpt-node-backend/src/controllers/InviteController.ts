import { Request, Response } from 'express';
import { randomBytes } from 'crypto';
import { BaseController } from './BaseController';
import { Invite } from '../models/Invite';
import User from '../models/User';
import { emailService } from '../services/EmailService';

const APP_URL = process.env.APP_URL || 'https://metapunish.com';
const ADMIN_INVITE_TTL_MS = 48 * 60 * 60 * 1000;   // 48 hours

export class InviteController extends BaseController {

    /**
     * POST /admin/invites
     * Admin sends an admin-level invite to an email address
     */
    createAdminInvite = async (req: Request, res: Response): Promise<void> => {
        try {
            const { email } = req.body;
            if (!email) { res.status(400).json({ success: false, error: 'email is required' }); return; }
            const betaPromoCode = process.env.BETA_PROMO_CODE;

            const adminUser = (req as any).user;

            // Check if already invited and still pending
            const existing = await Invite.findOne({ email, type: 'admin_invite', status: 'pending' });
            if (existing && existing.expiresAt > new Date()) {
                res.status(409).json({ success: false, error: 'An active invite for this email already exists' });
                return;
            }

            const token = randomBytes(32).toString('hex');
            const invite = await Invite.create({
                token,
                type: 'admin_invite',
                email,
                invitedById: adminUser._id,
                invitedByName: adminUser.name,
                status: 'pending',
                expiresAt: new Date(Date.now() + ADMIN_INVITE_TTL_MS),
            });

            const inviteUrl = `${APP_URL}/signup?invite=${token}&role=admin`;
            await emailService.sendAdminInviteEmail(email, adminUser.name, inviteUrl, betaPromoCode);

            this.sendResponse(res, { success: true, data: { invite, inviteUrl } }, 201);
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to create invite');
        }
    };

    /**
     * GET /admin/invites
     * List all admin invites
     */
    listAdminInvites = async (req: Request, res: Response): Promise<void> => {
        try {
            const invites = await Invite.find({ type: 'admin_invite' })
                .sort({ createdAt: -1 })
                .limit(100)
                .lean();
            this.sendResponse(res, { success: true, data: invites });
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to list invites');
        }
    };

    /**
     * DELETE /admin/invites/:token
     * Revoke an invite
     */
    revokeInvite = async (req: Request, res: Response): Promise<void> => {
        try {
            const { token } = req.params;
            const invite = await Invite.findOneAndUpdate(
                { token, status: 'pending' },
                { status: 'expired' },
                { new: true }
            );
            if (!invite) { res.status(404).json({ success: false, error: 'Invite not found or already used' }); return; }
            this.sendResponse(res, { success: true, data: invite });
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to revoke invite');
        }
    };

    /**
     * GET /invites/validate/:token
     * Validate an invite token (public — used on signup page)
     */
    validateInvite = async (req: Request, res: Response): Promise<void> => {
        try {
            const { token } = req.params;
            const invite = await Invite.findOne({ token });
            if (!invite) { res.status(404).json({ success: false, error: 'Invalid invite link' }); return; }
            if (invite.status !== 'pending') { res.status(410).json({ success: false, error: 'This invite has already been used or expired' }); return; }
            if (invite.expiresAt < new Date()) {
                await Invite.updateOne({ _id: invite._id }, { status: 'expired' });
                res.status(410).json({ success: false, error: 'This invite has expired' });
                return;
            }
            this.sendResponse(res, {
                success: true,
                data: {
                    type: invite.type,
                    email: invite.email,
                    invitedByName: invite.invitedByName,
                    expiresAt: invite.expiresAt,
                },
            });
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to validate invite');
        }
    };

    /**
     * POST /users/referral/invite
     * Authenticated user sends a referral invite to an email
     */
    sendReferralInvite = async (req: Request, res: Response): Promise<void> => {
        try {
            const { email } = req.body;
            if (!email) { res.status(400).json({ success: false, error: 'email is required' }); return; }

            const userId = (req as any).user?.id;
            const senderUser = await User.findById(userId).lean();
            if (!senderUser) { res.status(404).json({ success: false, error: 'User not found' }); return; }

            const inviteUrl = `${APP_URL}/signup?ref=${(senderUser as any).referralCode}`;
            await emailService.sendReferralInviteEmail(email, (senderUser as any).name, inviteUrl);

            this.sendResponse(res, { success: true, data: { inviteUrl } });
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to send referral invite');
        }
    };

    /**
     * GET /users/referral/stats
     * Get current user's referral stats and referees
     */
    getReferralStats = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = (req as any).user?.id;
            const user = await User.findById(userId).lean() as any;
            if (!user) { res.status(404).json({ success: false, error: 'User not found' }); return; }

            const referees = await User.find({ referredBy: user._id })
                .select('name email tier createdAt')
                .sort({ createdAt: -1 })
                .lean();

            this.sendResponse(res, {
                success: true,
                data: {
                    referralCode: user.referralCode,
                    referralLink: `${APP_URL}/signup?ref=${user.referralCode}`,
                    referralCount: user.referralCount ?? 0,
                    referralCredits: user.referralCredits ?? 0,
                    referees: referees.map((r: any) => ({
                        name: r.name,
                        email: r.email,
                        tier: r.tier,
                        joinedAt: r.createdAt,
                    })),
                },
            });
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to get referral stats');
        }
    };
}

export const inviteController = new InviteController();
