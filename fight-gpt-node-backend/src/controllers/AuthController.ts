import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { BaseController } from './BaseController';
import User, { IUser } from '../models/User';
import UserGame from '../models/UserGame';
import { emailService } from '../services/EmailService';

export class AuthController extends BaseController {
    /**
     * Register a new user
     */
    public register = async (req: Request, res: Response): Promise<void> => {
        try {
            const { name, email, password, location } = req.body;

            // Check if user already exists
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                this.sendError(res, 'User already exists', 400);
                return;
            }

            // Create new user
            const user = new User({
                name,
                email,
                password,
                location,
                onboardingCompleted: false,
                preferences: {
                    favoriteGames: [],
                    skillLevel: 'beginner',
                },
            });

            await user.save();

            // Send welcome email (non-blocking)
            emailService.sendWelcomeEmail(user.email, user.name).catch(() => {});

            // Generate JWT
            const token = this.generateToken(user);

            this.sendResponse(res, {
                success: true,
                data: {
                    user: {
                        id: user._id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
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

            this.sendResponse(res, {
                success: true,
                data: {
                    user: {
                        id: user._id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
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

            // Fetch the primary active game slot for this user to determine planType and main character
            const activeGame = await UserGame.findOne({ user: userId, isActive: true }).sort({ createdAt: -1 });

            // Map tier → planType so web + mobile premium gates work
            // Prefer planType from UserGame if available, fallback to user.tier mapping
            const planType = activeGame ? activeGame.planType : (user.tier === 'FREE' ? 'free' : 'premium');

            this.sendResponse(res, {
                success: true,
                data: {
                    user: {
                        ...user.toObject(),
                        planType,
                        slots: user.slots || [],
                        // Ensure mainCharacter is reactive for the web frontend
                        preferences: {
                            ...user.preferences,
                            mainCharacter: activeGame?.character || user.preferences?.mainCharacter
                        }
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

            this.sendResponse(res, {
                success: true,
                data: { userId: user._id, tier: user.tier },
            });
        } catch (error) {
            this.sendError(res, 'Failed to update tier', 500);
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
