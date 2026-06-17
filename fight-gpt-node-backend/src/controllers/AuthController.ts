import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { BaseController } from './BaseController';
import User, { IUser } from '../models/User';
import UserGame from '../models/UserGame';
import { Invite } from '../models/Invite';
import { emailService } from '../services/EmailService';
import { AppConfig } from '../config/app';
import { NotificationRepository } from '../repositories/NotificationRepository';
import { NotificationService } from '../services/NotificationService';

const DISPOSABLE_DOMAINS = new Set([
    'mailinator.com', 'guerrillamail.com', 'temp-mail.org', 'throwam.com',
    'yopmail.com', 'tempmail.com', 'fakeinbox.com', 'sharklasers.com',
    'spam4.me', 'trashmail.com', 'trashmail.at', 'trashmail.me',
    'dispostable.com', 'maildrop.cc', 'getairmail.com', 'filzmail.com',
    '10minutemail.com', 'tempr.email', 'discard.email', 'mailnull.com',
    'spamgourmet.com', 'spamherelots.com', 'mytrashmail.com', 'mt2015.com',
]);

function normalizeGmail(email: string): string | null {
    const [local, domain] = email.toLowerCase().split('@');
    if (domain !== 'gmail.com') return null;
    return local.replace(/\./g, '').split('+')[0] + '@gmail.com';
}

function isBotEmail(email: string): boolean {
    const lower = email.toLowerCase().trim();
    const atIdx = lower.lastIndexOf('@');
    if (atIdx < 1) return true;
    const local = lower.slice(0, atIdx);
    const domain = lower.slice(atIdx + 1);

    if (DISPOSABLE_DOMAINS.has(domain)) return true;

    // Dotted-Gmail abuse: bots create fake-unique addresses using dots + digits
    if (domain === 'gmail.com') {
        const dots = (local.match(/\./g) || []).length;
        const digits = (local.match(/\d/g) || []).length;
        if (dots >= 3) return true;
        if (dots >= 2 && digits >= 2) return true;
    }

    return false;
}

export class AuthController extends BaseController {
    /**
     * Register a new user
     */
    public register = async (req: Request, res: Response): Promise<void> => {
        try {
            const { name, email, password, location, inviteToken, referralCode } = req.body;

            if (!name || !email || !password) {
                this.sendError(res, 'Name, email and password are required', 400);
                return;
            }

            const emailLower = email.toLowerCase().trim();

            // Reject bot/disposable emails
            if (isBotEmail(emailLower)) {
                this.sendError(res, 'Registration not allowed with this email address', 403);
                return;
            }

            // Check if user already exists — also match normalized Gmail to block dot-trick duplicates
            const normalizedGmail = normalizeGmail(emailLower);
            const emailQuery = normalizedGmail
                ? { $or: [{ email: emailLower }, { email: normalizedGmail }] }
                : { email: emailLower };
            const existingUser = await User.findOne(emailQuery);
            if (existingUser) {
                this.sendError(res, 'User already exists', 400);
                return;
            }

            // Validate invite token if provided
            let invite = null;
            let grantAdminRole = false;
            if (inviteToken) {
                invite = await Invite.findOne({ token: inviteToken, status: 'pending' });
                if (!invite || invite.expiresAt < new Date()) {
                    this.sendError(res, 'Invalid or expired invite link', 400);
                    return;
                }
                if (invite.type === 'admin_invite') grantAdminRole = true;
            }

            // Resolve referrer
            let referrer = null;
            if (referralCode && !inviteToken) {
                referrer = await User.findOne({ referralCode });
            }

            // Create new user
            const user = new User({
                name,
                email,
                password,
                location,
                role: grantAdminRole ? 'admin' : 'user',
                referredBy: referrer?._id,
                onboardingCompleted: false,
                preferences: {
                    favoriteGames: [],
                    skillLevel: 'beginner',
                },
            });

            await user.save();

            // Mark invite as accepted
            if (invite) {
                invite.status = 'accepted';
                invite.acceptedByUserId = user._id as any;
                await invite.save();
            }

            // Credit referrer
            if (referrer) {
                referrer.referralCount = (referrer.referralCount || 0) + 1;
                referrer.referralCredits = (referrer.referralCredits || 0) + 1;
                referrer.gamification.xp = (referrer.gamification?.xp || 0) + 100;
                await referrer.save();
            }

            // Send welcome email (non-blocking)
            emailService.sendWelcomeEmail(user.email, user.name).catch(() => {});

            // Send onboarding notification to Discovery Feed
            const notificationService = new NotificationService(new NotificationRepository());
            notificationService.notify(user._id, 'META_SHIFT', {
                gameId: 'sf6',
                title: 'Meta Intelligence Active',
                description: 'We have processed recent SF6 tournaments. Check the Discovery Feed for the latest scenarios.',
                link: '/dashboard/meta'
            }, 'high').catch(() => {});

            // Generate JWT
            const token = this.generateToken(user);

            const registerTierUpper = (user.tier || 'FREE').toUpperCase();
            const registerPlanType = (user.role === 'admin' || registerTierUpper !== 'FREE') ? 'premium' : 'free';

            this.sendResponse(res, {
                success: true,
                data: {
                    user: {
                        id: user._id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        tier: registerTierUpper,
                        planType: registerPlanType,
                        onboardingCompleted: user.onboardingCompleted,
                    },
                    token,
                },
            }, 201);
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Registration failed', 500);
        }
    };

    /**
     * Login user
     */
    public login = async (req: Request, res: Response): Promise<void> => {
        try {
            const { email, password } = req.body;

            // Check if user exists
            const user = await User.findOne({ email });
            if (!user) {
                this.sendError(res, 'Invalid credentials', 401);
                return;
            }

            // Check password
            const isMatch = await user.comparePassword(password);
            if (!isMatch) {
                this.sendError(res, 'Invalid credentials', 401);
                return;
            }

            // Generate JWT
            const token = this.generateToken(user);

            const loginTierUpper = (user.tier || 'FREE').toUpperCase();
            const loginPlanType = (user.role === 'admin' || loginTierUpper !== 'FREE') ? 'premium' : 'free';

            this.sendResponse(res, {
                success: true,
                data: {
                    user: {
                        id: user._id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        tier: loginTierUpper,
                        planType: loginPlanType,
                        onboardingCompleted: user.onboardingCompleted,
                        preferences: user.preferences,
                        slots: user.slots || [],
                    },
                    token,
                },
            });
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Login failed', 500);
        }
    };

    /**
     * Get current user — returns tier + planType so all premium gates work
     */
    public getMe = async (req: Request, res: Response): Promise<void> => {
        try {
            // @ts-ignore - user is attached by middleware
            const userId = req.user.id;
            const user = await User.findById(userId).select('-password');

            if (!user) {
                this.sendError(res, 'User not found', 404);
                return;
            }

            // Fetch the primary active game slot + populate the character reference so we get
            // the character slug (e.g. 'ryu') not a raw ObjectId.
            const activeGame = await (UserGame as any)
                .findOne({ user: userId, isActive: true })
                .sort({ createdAt: -1 })
                .populate('character', 'name aliases')
                .exec();

            // Resolve main character: prefer slot (string slug) → populated UserGame character name → preferences fallback
            const resolvedMainCharacter: string =
                user.slots?.[0]?.characterId ||
                (activeGame?.character as any)?.name?.toLowerCase().replace(/\s+/g, '_') ||
                (user.preferences as any)?.mainCharacter ||
                '';

            // Derive planType from user.tier — single source of truth updated by Stripe.
            // Case-insensitive: handles both 'PRO' and legacy 'pro' values.
            const tierUpper = (user.tier || 'FREE').toUpperCase();
            const planType = (user.role === 'admin' || tierUpper !== 'FREE') ? 'premium' : 'free';

            this.sendResponse(res, {
                success: true,
                data: {
                    user: {
                        ...user.toObject(),
                        planType,
                        tier: tierUpper,   // always return uppercase so frontend comparisons are consistent
                        slots: user.slots || [],
                        preferences: {
                            ...user.preferences,
                            mainCharacter: resolvedMainCharacter,
                        },
                    },
                },
            });
        } catch (error) {
            this.sendError(res, 'Failed to fetch user', 500);
        }
    };

    /**
     * Internal endpoint called by Stripe webhook to update a user's tier
     * Protected by INTERNAL_WEBHOOK_SECRET header — not user JWT
     */
    public updateTierFromStripe = async (req: Request, res: Response): Promise<void> => {
        try {
            const secret = process.env.INTERNAL_WEBHOOK_SECRET;
            if (secret && req.headers['x-internal-secret'] !== secret) {
                this.sendError(res, 'Unauthorized', 401);
                return;
            }

            const { stripeCustomerId, stripeSubscriptionId, tier, email } = req.body;

            if (!tier || (!stripeCustomerId && !email)) {
                this.sendError(res, 'tier and (stripeCustomerId or email) are required', 400);
                return;
            }

            // Find user by stripeCustomerId first, fall back to email
            let user = stripeCustomerId
                ? await User.findOne({ stripeCustomerId })
                : null;

            if (!user && email) {
                user = await User.findOne({ email });
            }

            if (!user) {
                this.sendError(res, 'User not found', 404);
                return;
            }

            const validTiers = ['FREE', 'COMPETITOR', 'PRO'];
            if (!validTiers.includes(tier)) {
                this.sendError(res, `Invalid tier. Must be one of: ${validTiers.join(', ')}`, 400);
                return;
            }

            user.tier = tier as IUser['tier'];
            if (stripeCustomerId) user.stripeCustomerId = stripeCustomerId;
            if (stripeSubscriptionId) user.stripeSubscriptionId = stripeSubscriptionId;
            await user.save();

            // Sync UserGame.planType so it stays consistent with user.tier
            const userGamePlanType = tier === 'FREE' ? 'free' : 'premium';
            await UserGame.updateMany({ user: user._id }, { planType: userGamePlanType });

            this.sendResponse(res, {
                success: true,
                data: { userId: user._id, tier: user.tier },
            });
        } catch (error) {
            this.sendError(res, 'Failed to update tier', 500);
        }
    };

    /**
     * Update user profile (name, etc)
     */
    public updateProfile = async (req: Request, res: Response): Promise<void> => {
        try {
            // @ts-ignore
            const userId = req.user.id;
            const { name } = req.body;

            const user = await User.findById(userId);
            if (!user) {
                this.sendError(res, 'User not found', 404);
                return;
            }

            if (name) user.name = name;
            await user.save();

            this.sendResponse(res, { success: true, data: user });
        } catch (error) {
            this.sendError(res, 'Failed to update profile', 500);
        }
    };

    /**
     * Update user preferences (skill level, region, etc)
     */
    public updatePreferences = async (req: Request, res: Response): Promise<void> => {
        try {
            // @ts-ignore
            const userId = req.user.id;
            const { preferences } = req.body;

            const user = await User.findById(userId);
            if (!user) {
                this.sendError(res, 'User not found', 404);
                return;
            }

            user.preferences = {
                ...(user.preferences || {}),
                ...preferences
            };

            await user.save();

            this.sendResponse(res, { success: true, data: user });
        } catch (error) {
            this.sendError(res, 'Failed to update preferences', 500);
        }
    };

    /**
     * POST /auth/forgot-password — send reset email (public)
     */
    public forgotPassword = async (req: Request, res: Response): Promise<void> => {
        try {
            const { email } = req.body;
            if (!email) {
                this.sendError(res, 'Email is required', 400);
                return;
            }

            // Always respond with success to prevent email enumeration
            const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+passwordResetToken +passwordResetExpires');
            if (!user) {
                this.sendResponse(res, { success: true, data: { message: 'If that email exists, a reset link has been sent.' } });
                return;
            }

            // Generate a secure random token, store its SHA-256 hash
            const rawToken = crypto.randomBytes(32).toString('hex');
            const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

            user.passwordResetToken = hashedToken;
            user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
            await user.save();

            const resetUrl = `${AppConfig.APP_URL}/reset-password?token=${rawToken}`;
            emailService.sendPasswordResetEmail(user.email, user.name, resetUrl).catch(() => {});

            this.sendResponse(res, { success: true, data: { message: 'If that email exists, a reset link has been sent.' } });
        } catch (error) {
            this.sendError(res, 'Failed to process request', 500);
        }
    };

    /**
     * POST /auth/reset-password — set new password using reset token (public)
     */
    public resetPassword = async (req: Request, res: Response): Promise<void> => {
        try {
            const { token, password } = req.body;
            if (!token || !password) {
                this.sendError(res, 'Token and new password are required', 400);
                return;
            }
            if (password.length < 6) {
                this.sendError(res, 'Password must be at least 6 characters', 400);
                return;
            }

            const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
            const user = await User.findOne({
                passwordResetToken: hashedToken,
                passwordResetExpires: { $gt: new Date() },
            }).select('+passwordResetToken +passwordResetExpires');

            if (!user) {
                this.sendError(res, 'Invalid or expired reset token', 400);
                return;
            }

            user.password = password;
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;
            await user.save();

            this.sendResponse(res, { success: true, data: { message: 'Password updated. You can now log in.' } });
        } catch (error) {
            this.sendError(res, 'Failed to reset password', 500);
        }
    };

    /**
     * Generate JWT Token
     */
    private generateToken(user: IUser): string {
        const payload = {
            user: {
                id: user._id,
            },
        };

        // Use a secret key from env or a default for dev
        const secret = process.env.JWT_SECRET || 'fight-gpt-secret-key-change-in-prod';

        return jwt.sign(payload, secret, { expiresIn: '7d' });
    }
}
