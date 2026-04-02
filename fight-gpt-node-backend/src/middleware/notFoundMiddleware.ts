import { Request, Response } from 'express';
import { ApiResponse } from '../types';

/**
 * Not found middleware
 * Follows Single Responsibility Principle - handles 404 errors
 */
export const notFoundMiddleware = (req: Request, res: Response): void => {
  const response: ApiResponse = {
    success: false,
    error: `Route not found: ${req.method} ${req.path}`,
  };

  res.status(404).json(response);
};

