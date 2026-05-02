import { Request, Response, NextFunction } from 'express';
export declare const authMiddleware: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Middleware to check if user is an admin
 * Must be used AFTER authMiddleware
 */
/**
 * Optional auth middleware — sets req.user if valid token present, never blocks
 */
export declare const optionalAuthMiddleware: (req: Request, res: Response, next: NextFunction) => void;
export declare const adminMiddleware: (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=auth.d.ts.map