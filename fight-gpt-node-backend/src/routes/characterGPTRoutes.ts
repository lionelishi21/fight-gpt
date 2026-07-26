import { Router } from 'express';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validationMiddleware';
import { CharacterGPTController } from '../controllers/CharacterGPTController';
import { optionalAuthMiddleware } from '../middleware/auth';

/**
 * Character GPT Routes
 * 
 * Exposes per-character AI coach endpoints. Each character has their own
 * personality, frame data, and coaching style powered by Gemini + CharacterEncyclopedia.
 *
 * Routes:
 *   GET  /api/character-gpt/:gameId/available           — List available character GPTs
 *   POST /api/character-gpt/:gameId/:characterId/chat   — Chat with a character's AI coach
 */
export class CharacterGPTRoutes {
    private router: Router;
    private controller: CharacterGPTController;

    constructor(controller: CharacterGPTController) {
        this.controller = controller;
        this.router = Router();
        this.setupRoutes();
    }

    private setupRoutes(): void {
        // GET /api/character-gpt/:gameId/available
        // Returns all characters with GPT personas for a game
        this.router.get(
            '/:gameId/available',
            (req, res) => this.controller.getAvailable(req, res),
        );

        // POST /api/character-gpt/:gameId/:characterId/chat
        // Chat with a specific character's AI coach
        this.router.post(
            '/:gameId/:characterId/chat',
            optionalAuthMiddleware,
            this.validateChatMessage(),
            validateRequest,
            (req, res) => this.controller.chat(req, res),
        );
    }

    private validateChatMessage() {
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

    public getRouter(): Router {
        return this.router;
    }
}
