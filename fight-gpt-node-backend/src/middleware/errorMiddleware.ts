import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';

/**
 * Error middleware
 * Follows Single Responsibility Principle - handles all unhandled errors
 */
export const errorMiddleware = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('[Error Middleware] Unhandled error:', error);

  const response: ApiResponse = {
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message,
  };

  res.status(500).json(response);
};

