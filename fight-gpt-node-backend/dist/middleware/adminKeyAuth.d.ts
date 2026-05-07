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
export declare const adminKeyAuth: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=adminKeyAuth.d.ts.map