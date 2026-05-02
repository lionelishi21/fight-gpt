import { Router } from 'express';
import { ChatController } from '../controllers/ChatController';
/**
 * Chat Routes
 * Handles chat-related routes
 * Follows Single Responsibility Principle - sets up chat routes
 */
export declare class ChatRoutes {
    private router;
    private controller;
    constructor(controller: ChatController);
    /**
     * Setup routes
     */
    private setupRoutes;
    /**
     * Validation for sending a message
     */
    private validateSendMessage;
    /**
     * Get router instance
     */
    getRouter(): Router;
}
//# sourceMappingURL=chatRoutes.d.ts.map