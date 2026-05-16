"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const BaseController_1 = require("./BaseController");
const User_1 = __importDefault(require("../models/User"));
const UserGame_1 = __importDefault(require("../models/UserGame"));
const Invite_1 = require("../models/Invite");
const EmailService_1 = require("../services/EmailService");
const NotificationRepository_1 = require("../repositories/NotificationRepository");
const NotificationService_1 = require("../services/NotificationService");
class AuthController extends BaseController_1.BaseController {
    /**
     * Register a new user
     */
    register = async (req, res) => {
        try {
            const { name, email, password, location, inviteToken, referralCode } = req.body;
            // Check if user already exists
            const existingUser = await User_1.default.findOne({ email });
            if (existingUser) {
                this.sendError(res, 'User already exists', 400);
                return;
            }
            // Validate invite token if provided
            let invite = null;
            let grantAdminRole = false;
            if (inviteToken) {
                invite = await Invite_1.Invite.findOne({ token: inviteToken, status: 'pending' });
                if (!invite || invite.expiresAt < new Date()) {
                    this.sendError(res, 'Invalid or expired invite link', 400);
                    return;
                }
                if (invite.type === 'admin_invite')
                    grantAdminRole = true;
            }
            // Resolve referrer
            let referrer = null;
            if (referralCode && !inviteToken) {
                referrer = await User_1.default.findOne({ referralCode });
            }
            // Create new user
            const user = new User_1.default({
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
                invite.acceptedByUserId = user._id;
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
            EmailService_1.emailService.sendWelcomeEmail(user.email, user.name).catch(() => { });
            // Send onboarding notification to Discovery Feed
            const notificationService = new NotificationService_1.NotificationService(new NotificationRepository_1.NotificationRepository());
            notificationService.notify(user._id, 'META_SHIFT', {
                gameId: 'sf6',
                title: 'Meta Intelligence Active',
                description: 'We have processed recent SF6 tournaments. Check the Discovery Feed for the latest scenarios.',
                link: '/dashboard/meta'
            }, 'high').catch(() => { });
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
        }
        catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Registration failed', 500);
        }
    };
    /**
     * Login user
     */
    login = async (req, res) => {
        try {
            const { email, password } = req.body;
            // Check if user exists
            const user = await User_1.default.findOne({ email });
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
        }
        catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Login failed', 500);
        }
    };
    /**
     * Get current user — returns tier + planType so all premium gates work
     */
    getMe = async (req, res) => {
        try {
            // @ts-ignore - user is attached by middleware
            const userId = req.user.id;
            const user = await User_1.default.findById(userId).select('-password');
            if (!user) {
                this.sendError(res, 'User not found', 404);
                return;
            }
            // Fetch the primary active game slot + populate the character reference so we get
            // the character slug (e.g. 'ryu') not a raw ObjectId.
            const activeGameQuery = UserGame_1.default.findOne({ user: userId, isActive: true })
                .sort({ createdAt: -1 })
                .populate('character', 'name aliases');
            const activeGame = await activeGameQuery.exec();
            // Resolve main character: prefer slot (string slug) → populated UserGame character name → preferences fallback
            const resolvedMainCharacter = user.slots?.[0]?.characterId ||
                activeGame?.character?.name?.toLowerCase().replace(/\s+/g, '_') ||
                user.preferences?.mainCharacter ||
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
                        tier: tierUpper, // always return uppercase so frontend comparisons are consistent
                        slots: user.slots || [],
                        preferences: {
                            ...user.preferences,
                            mainCharacter: resolvedMainCharacter,
                        },
                    },
                },
            });
        }
        catch (error) {
            this.sendError(res, 'Failed to fetch user', 500);
        }
    };
    /**
     * Internal endpoint called by Stripe webhook to update a user's tier
     * Protected by INTERNAL_WEBHOOK_SECRET header — not user JWT
     */
    updateTierFromStripe = async (req, res) => {
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
                ? await User_1.default.findOne({ stripeCustomerId })
                : null;
            if (!user && email) {
                user = await User_1.default.findOne({ email });
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
            user.tier = tier;
            if (stripeCustomerId)
                user.stripeCustomerId = stripeCustomerId;
            if (stripeSubscriptionId)
                user.stripeSubscriptionId = stripeSubscriptionId;
            await user.save();
            // Sync UserGame.planType so it stays consistent with user.tier
            const userGamePlanType = tier === 'FREE' ? 'free' : 'premium';
            await UserGame_1.default.updateMany({ user: user._id }, { planType: userGamePlanType });
            this.sendResponse(res, {
                success: true,
                data: { userId: user._id, tier: user.tier },
            });
        }
        catch (error) {
            this.sendError(res, 'Failed to update tier', 500);
        }
    };
    /**
     * Update user profile (name, etc)
     */
    updateProfile = async (req, res) => {
        try {
            // @ts-ignore
            const userId = req.user.id;
            const { name } = req.body;
            const user = await User_1.default.findById(userId);
            if (!user) {
                this.sendError(res, 'User not found', 404);
                return;
            }
            if (name)
                user.name = name;
            await user.save();
            this.sendResponse(res, { success: true, data: user });
        }
        catch (error) {
            this.sendError(res, 'Failed to update profile', 500);
        }
    };
    /**
     * Update user preferences (skill level, region, etc)
     */
    updatePreferences = async (req, res) => {
        try {
            // @ts-ignore
            const userId = req.user.id;
            const { preferences } = req.body;
            const user = await User_1.default.findById(userId);
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
        }
        catch (error) {
            this.sendError(res, 'Failed to update preferences', 500);
        }
    };
    /**
     * Generate JWT Token
     */
    generateToken(user) {
        const payload = {
            user: {
                id: user._id,
            },
        };
        // Use a secret key from env or a default for dev
        const secret = process.env.JWT_SECRET || 'fight-gpt-secret-key-change-in-prod';
        return jsonwebtoken_1.default.sign(payload, secret, { expiresIn: '7d' });
    }
}
exports.AuthController = AuthController;
//# sourceMappingURL=AuthController.js.map