import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { ApiResponse } from '../types';

/**
 * Validation middleware
 * Follows Single Responsibility Principle - handles request validation
 */
export const validateRequest = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((error) => error.msg).join(', ');
    const response: ApiResponse = {
      success: false,
      error: `Validation failed: ${errorMessages}`,
    };

    res.status(400).json(response);
    return;
  }

  next();
};

