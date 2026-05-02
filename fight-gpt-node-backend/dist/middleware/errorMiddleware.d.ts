import { Request, Response, NextFunction } from 'express';
/**
 * Error middleware
 * Follows Single Responsibility Principle - handles all unhandled errors
 */
export declare const errorMiddleware: (error: Error, req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=errorMiddleware.d.ts.map