"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.inviteController = exports.InviteController = void 0;
const crypto_1 = require("crypto");
const BaseController_1 = require("./BaseController");
const Invite_1 = require("../models/Invite");
const User_1 = __importDefault(require("../models/User"));
const EmailService_1 = require("../services/EmailService");
const APP_URL = process.env.APP_URL || 'https://metapunish.com';
const ADMIN_INVITE_TTL_MS = 48 * 60 * 60 * 1000; // 48 hours
class InviteController extends BaseController_1.BaseController {
    /**
     * POST /admin/invites
     * Admin sends an admin-level invite to an email address
     */
    createAdminInvite = async (req, res) => {
        try {
            const { email } = req.body;
            if (!email) {
                res.status(400).json({ success: false, error: 'email is required' });
                return;
            }
            const betaPromoCode = process.env.BETA_PROMO_CODE;
            const adminUser = req.user;
            // Check if already invited and still pending
            const existing = await Invite_1.Invite.findOne({ email, type: 'admin_invite', status: 'pending' });
            if (existing && existing.expiresAt > new Date()) {
                res.status(409).json({ success: false, error: 'An active invite for this email already exists' });
                return;
            }
            const token = (0, crypto_1.randomBytes)(32).toString('hex');
            const invite = await Invite_1.Invite.create({
                token,
                type: 'admin_invite',
                email,
                invitedById: adminUser._id,
                invitedByName: adminUser.name,
                status: 'pending',
                expiresAt: new Date(Date.now() + ADMIN_INVITE_TTL_MS),
            });
            const inviteUrl = `${APP_URL}/signup?invite=${token}&role=admin`;
            await EmailService_1.emailService.sendAdminInviteEmail(email, adminUser.name, inviteUrl, betaPromoCode);
            this.sendResponse(res, { success: true, data: { invite, inviteUrl } }, 201);
        }
        catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to create invite');
        }
    };
    /**
     * GET /admin/invites
     * List all admin invites
     */
    listAdminInvites = async (req, res) => {
        try {
            const invites = await Invite_1.Invite.find({ type: 'admin_invite' })
                .sort({ createdAt: -1 })
                .limit(100)
                .lean();
            this.sendResponse(res, { success: true, data: invites });
        }
        catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to list invites');
        }
    };
    /**
     * DELETE /admin/invites/:token
     * Revoke an invite
     */
    revokeInvite = async (req, res) => {
        try {
            const { token } = req.params;
            const invite = await Invite_1.Invite.findOneAndUpdate({ token, status: 'pending' }, { status: 'expired' }, { new: true });
            if (!invite) {
                res.status(404).json({ success: false, error: 'Invite not found or already used' });
                return;
            }
            this.sendResponse(res, { success: true, data: invite });
        }
        catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to revoke invite');
        }
    };
    /**
     * GET /invites/validate/:token
     * Validate an invite token (public — used on signup page)
     */
    validateInvite = async (req, res) => {
        try {
            const { token } = req.params;
            const invite = await Invite_1.Invite.findOne({ token });
            if (!invite) {
                res.status(404).json({ success: false, error: 'Invalid invite link' });
                return;
            }
            if (invite.status !== 'pending') {
                res.status(410).json({ success: false, error: 'This invite has already been used or expired' });
                return;
            }
            if (invite.expiresAt < new Date()) {
                await Invite_1.Invite.updateOne({ _id: invite._id }, { status: 'expired' });
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
        }
        catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to validate invite');
        }
    };
    /**
     * POST /users/referral/invite
     * Authenticated user sends a referral invite to an email
     */
    sendReferralInvite = async (req, res) => {
        try {
            const { email } = req.body;
            if (!email) {
                res.status(400).json({ success: false, error: 'email is required' });
                return;
            }
            const userId = req.user?.id;
            const senderUser = await User_1.default.findById(userId).lean();
            if (!senderUser) {
                res.status(404).json({ success: false, error: 'User not found' });
                return;
            }
            const inviteUrl = `${APP_URL}/signup?ref=${senderUser.referralCode}`;
            await EmailService_1.emailService.sendReferralInviteEmail(email, senderUser.name, inviteUrl);
            this.sendResponse(res, { success: true, data: { inviteUrl } });
        }
        catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to send referral invite');
        }
    };
    /**
     * GET /users/referral/stats
     * Get current user's referral stats and referees
     */
    getReferralStats = async (req, res) => {
        try {
            const userId = req.user?.id;
            const user = await User_1.default.findById(userId).lean();
            if (!user) {
                res.status(404).json({ success: false, error: 'User not found' });
                return;
            }
            const referees = await User_1.default.find({ referredBy: user._id })
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
                    referees: referees.map((r) => ({
                        name: r.name,
                        email: r.email,
                        tier: r.tier,
                        joinedAt: r.createdAt,
                    })),
                },
            });
        }
        catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to get referral stats');
        }
    };
}
exports.InviteController = InviteController;
exports.inviteController = new InviteController();
//# sourceMappingURL=InviteController.js.map