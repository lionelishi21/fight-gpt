import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

interface JwtPayload {
    user: {
        id: string;
    };
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    // Get token from header
    const token = req.header('x-auth-token');

    // Check if not token
    if (!token) {
        res.status(401).json({ success: false, error: 'No token, authorization denied' });
        return;
    }

    try {
        const secret = process.env.JWT_SECRET || 'fight-gpt-secret-key-change-in-prod';
        const decoded = jwt.verify(token, secret) as JwtPayload;

        // @ts-ignore
        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).json({ success: false, error: 'Token is not valid' });
    }
};

/**
 * Middleware to check if user is an admin
 * Must be used AFTER authMiddleware
 */
/**
 * Optional auth middleware — sets req.user if valid token present, never blocks
 */
export const optionalAuthMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    const token = req.header('x-auth-token');
    if (!token) { next(); return; }
    try {
        const secret = process.env.JWT_SECRET || 'fight-gpt-secret-key-change-in-prod';
        const decoded = jwt.verify(token, secret) as JwtPayload;
        (req as any).user = decoded.user;
    } catch { /* invalid token — just continue unauthenticated */ }
    next();
};

export const adminMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        // @ts-ignore
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, error: 'Not authorized' });
            return;
        }

        const user = await User.findById(userId);
        if (!user || user.role !== 'admin') {
            res.status(403).json({ success: false, error: 'Access denied: Admin only' });
            return;
        }

        // Attach full user so controllers can access _id, name, etc.
        (req as any).user = user;
        next();
    } catch (err) {
        res.status(500).json({ success: false, error: 'Server validation error' });
    }
};

/**
 * Middleware to check if user has a premium tier (COMPETITOR or PRO)
 * Must be used AFTER authMiddleware
 */
export const premiumMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        // @ts-ignore
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, error: 'Not authorized' });
            return;
        }

        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({ success: false, error: 'User not found' });
            return;
        }

        // Admins and users with COMPETITOR or PRO tier have premium access
        // Case-insensitive to handle any legacy lowercase values from older Stripe webhook handler
        const tier = (user.tier || '').toUpperCase();
        if (user.role === 'admin' || tier === 'COMPETITOR' || tier === 'PRO') {
            // Attach full user for downstream use
            (req as any).user = user;
            next();
        } else {
            res.status(403).json({
                success: false,
                error: 'Premium subscription required',
                code: 'PREMIUM_REQUIRED'
            });
        }
    } catch (err) {
        res.status(500).json({ success: false, error: 'Tier validation error' });
    }
};
