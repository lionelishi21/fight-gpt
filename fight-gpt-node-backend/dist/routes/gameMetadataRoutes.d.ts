import { Router } from 'express';
import { GameMetadataController } from '../controllers/GameMetadataController';
/**
 * Game Metadata routes
 * Follows Single Responsibility Principle - handles routing for game metadata endpoints
 */
export declare class GameMetadataRoutes {
    private router;
    private controller;
    constructor(controller: GameMetadataController);
    /**
     * Setup routes
     * Note: Order matters - more specific routes must come before less specific ones
     */
    private setupRoutes;
    /**
     * Get router instance
     */
    getRouter(): Router;
    /**
     * Validation rules for create game metadata
     */
    private validateCreateGameMetadata;
    /**
     * Validation rules for update game metadata
     */
    private validateUpdateGameMetadata;
    /**
     * Validation rules for MongoDB ID parameter
     */
    private validateId;
    /**
     * Validation rules for gameId parameter
     */
    private validateGameId;
}
//# sourceMappingURL=gameMetadataRoutes.d.ts.map