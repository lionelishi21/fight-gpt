import { Request, Response } from 'express';
import { BaseController } from './BaseController';
export declare class AuthController extends BaseController {
    /**
     * Register a new user
     */
    register: (req: Request, res: Response) => Promise<void>;
    /**
     * Login user
     */
    login: (req: Request, res: Response) => Promise<void>;
    /**
     * Get current user — returns tier + planType so all premium gates work
     */
    getMe: (req: Request, res: Response) => Promise<void>;
    /**
     * Internal endpoint called by Stripe webhook to update a user's tier
     * Protected by INTERNAL_WEBHOOK_SECRET header — not user JWT
     */
    updateTierFromStripe: (req: Request, res: Response) => Promise<void>;
    /**
     * Update user profile (name, etc)
     */
    updateProfile: (req: Request, res: Response) => Promise<void>;
    /**
     * Update user preferences (skill level, region, etc)
     */
    updatePreferences: (req: Request, res: Response) => Promise<void>;
    /**
     * Generate JWT Token
     */
    private generateToken;
}
//# sourceMappingURL=AuthController.d.ts.map