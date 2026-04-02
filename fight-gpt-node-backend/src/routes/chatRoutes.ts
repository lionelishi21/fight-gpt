import { Router } from 'express';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validationMiddleware';
import { ChatController } from '../controllers/ChatController';

/**
 * Chat Routes
 * Handles chat-related routes
 * Follows Single Responsibility Principle - sets up chat routes
 */
export class ChatRoutes {
  private router: Router;
  private controller: ChatController;

  constructor(controller: ChatController) {
    this.controller = controller;
    this.router = Router();
    this.setupRoutes();
  }

  /**
   * Setup routes
   */
  private setupRoutes(): void {
    // POST /api/chat - Send a chat message
    this.router.post(
      '/',
      this.validateSendMessage(),
      validateRequest,
      (req, res, next) => this.controller.sendMessage(req, res, next)
    );

    // POST /api/chat/clear - Clear chat history
    this.router.post(
      '/clear',
      (req, res, next) => this.controller.clearChat(req, res, next)
    );
  }

  /**
   * Validation for sending a message
   */
  private validateSendMessage() {
    return [
      body('message')
        .trim()
        .notEmpty()
        .withMessage('Message is required')
        .isLength({ min: 1, max: 2000 })
        .withMessage('Message must be between 1 and 2000 characters'),
      body('history')
        .optional()
        .isArray()
        .withMessage('History must be an array'),
      body('history.*.role')
        .optional()
        .isIn(['user', 'assistant'])
        .withMessage('History role must be "user" or "assistant"'),
      body('history.*.content')
        .optional()
        .isString()
        .withMessage('History content must be a string'),
    ];
  }

  /**
   * Get router instance
   */
  public getRouter(): Router {
    return this.router;
  }
}
