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
export abstract class BaseController implements IBaseController {
  /**
   * Handle errors consistently
   */
  public handleError(
    error: unknown,
    req: Request,
    res: Response,
    _next: NextFunction
  ): void {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const statusCode = this.getErrorStatusCode(error);

    console.error(`[Controller Error] ${req.method} ${req.path}:`, errorMessage);

    this.sendResponse(res, { success: false, error: errorMessage }, statusCode);
  }

  /**
   * Send standardized API response
   */
  /**
   * Send standardized API response
   */
  public sendResponse<T>(
    res: Response,
    data: ApiResponse<T>,
    statusCode: number = 200
  ): void {
    res.status(statusCode).json(data);
  }

  /**
   * Send error response
   */
  protected sendError(
    res: Response,
    message: string,
    statusCode: number = 500
  ): void {
    this.sendResponse(res, { success: false, error: message }, statusCode);
  }

  /**
   * Get appropriate HTTP status code from error
   */
  private getErrorStatusCode(error: unknown): number {
    if (error instanceof Error) {
      if (error.message.includes('not found')) return 404;
      if (error.message.includes('invalid') || error.message.includes('validation')) return 400;
      if (error.message.includes('unauthorized') || error.message.includes('forbidden')) return 403;
    }
    return 500;
  }

  /**
   * Get request ID from headers or generate new one
   */
  protected getRequestId(req: Request): string {
    return (req.headers['x-request-id'] as string) || this.generateRequestId();
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

