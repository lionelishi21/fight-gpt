import { Request, Response, NextFunction } from 'express';

/**
 * Admin Key Auth Middleware
 *
 * Protects internal admin routes with a static secret key passed in
 * the `x-admin-key` header. This replaces IP-based rate limiting for
 * admin routes so internal dashboard polling never competes with
 * real user traffic.
 *
 * The key is set via ADMIN_API_SECRET in the environment.
 * Generate with: openssl rand -hex 32
 */
export const adminKeyAuth = (req: Request, res: Response, next: NextFunction): void => {
    const secret = process.env.ADMIN_API_SECRET;

    // If no secret is configured, only allow in development
    if (!secret) {
        if (process.env.NODE_ENV === 'production') {
            res.status(503).json({
                success: false,
                error: 'Admin service not configured. Set ADMIN_API_SECRET.',
            });
            return;
        }
        // In development, pass through with a warning
        console.warn('[adminKeyAuth] ADMIN_API_SECRET not set — bypassing in development mode');
        next();
        return;
    }

    const provided = req.headers['x-admin-key'];

    if (!provided || provided !== secret) {
        res.status(401).json({
            success: false,
            error: 'Unauthorized. Valid x-admin-key header required.',
        });
        return;
    }

    next();
};
