import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';
/**
 * Base controller interface
 * Follows Interface Segregation Principle
 */
export interface IBaseController {
    handleError(error: unknown, req: Request, res: Response, next: NextFunction): void;
    sendResponse<T>(res: Response, data: ApiResponse<T>, statusCode?: number): void;
}
/**
 * Base controller class
 * Follows Single Responsibility Principle - provides common controller functionality
 * Follows Open/Closed Principle - can be extended without modification
 */
export declare abstract class BaseController implements IBaseController {
    /**
     * Handle errors consistently
     */
    handleError(error: unknown, req: Request, res: Response, _next: NextFunction): void;
    /**
     * Send standardized API response
     */
    /**
     * Send standardized API response
     */
    sendResponse<T>(res: Response, data: ApiResponse<T>, statusCode?: number): void;
    /**
     * Send error response
     */
    protected sendError(res: Response, message: string, statusCode?: number): void;
    /**
     * Get appropriate HTTP status code from error
     */
    private getErrorStatusCode;
    /**
     * Get request ID from headers or generate new one
     */
    protected getRequestId(req: Request): string;
    /**
     * Generate unique request ID
     */
    private generateRequestId;
}
//# sourceMappingURL=BaseController.d.ts.map