"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatRoutes = void 0;
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const validationMiddleware_1 = require("../middleware/validationMiddleware");
const auth_1 = require("../middleware/auth");
/**
 * Chat Routes
 * Handles chat-related routes
 * Follows Single Responsibility Principle - sets up chat routes
 */
class ChatRoutes {
    router;
    controller;
    constructor(controller) {
        this.controller = controller;
        this.router = (0, express_1.Router)();
        this.setupRoutes();
    }
    /**
     * Setup routes
     */
    setupRoutes() {
        // POST /api/chat - Send a chat message (optional auth for user context)
        this.router.post('/', auth_1.optionalAuthMiddleware, this.validateSendMessage(), validationMiddleware_1.validateRequest, (req, res, next) => this.controller.sendMessage(req, res, next));
        // POST /api/chat/clear - Clear chat history
        this.router.post('/clear', (req, res, next) => this.controller.clearChat(req, res, next));
    }
    /**
     * Validation for sending a message
     */
    validateSendMessage() {
        return [
            (0, express_validator_1.body)('message')
                .trim()
                .notEmpty()
                .withMessage('Message is required')
                .isLength({ min: 1, max: 2000 })
                .withMessage('Message must be between 1 and 2000 characters'),
            (0, express_validator_1.body)('history')
                .optional()
                .isArray()
                .withMessage('History must be an array'),
            (0, express_validator_1.body)('history.*.role')
                .optional()
                .isIn(['user', 'assistant'])
                .withMessage('History role must be "user" or "assistant"'),
            (0, express_validator_1.body)('history.*.content')
                .optional()
                .isString()
                .withMessage('History content must be a string'),
        ];
    }
    /**
     * Get router instance
     */
    getRouter() {
        return this.router;
    }
}
exports.ChatRoutes = ChatRoutes;
//# sourceMappingURL=chatRoutes.js.map