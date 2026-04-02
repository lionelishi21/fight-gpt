import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { BaseController } from './BaseController';
import User, { IUser } from '../models/User';

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

            // Generate JWT
            const token = this.generateToken(user);

            this.sendResponse(res, {
                success: true,
                data: {
                    user: {
                        id: user._id,
                        name: user.name,
                        email: user.email,
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
                        onboardingCompleted: user.onboardingCompleted,
                        preferences: user.preferences,
                    },
                    token,
                },
            });
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Login failed', 500);
        }
    };

    /**
     * Get current user
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

            this.sendResponse(res, {
                success: true,
                data: { user },
            });
        } catch (error) {
            this.sendError(res, 'Failed to fetch user', 500);
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
