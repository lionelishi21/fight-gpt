import { Router } from 'express';
import { CharacterEncyclopediaController } from '../controllers/CharacterEncyclopediaController';
/**
 * Character Encyclopedia routes
 * Follows Single Responsibility Principle - handles routing for character encyclopedia endpoints
 */
export declare class CharacterEncyclopediaRoutes {
    private router;
    private controller;
    constructor(controller: CharacterEncyclopediaController);
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
     * Validation rules for create character encyclopedia
     */
    private validateCreateEncyclopedia;
    /**
     * Validation rules for update character encyclopedia
     */
    private validateUpdateEncyclopedia;
    /**
     * Validation rules for MongoDB ID parameter
     */
    private validateId;
    /**
     * Validation rules for gameId parameter
     */
    private validateGameId;
    /**
     * Validation rules for characterId parameter
     */
    private validateCharacterId;
}
//# sourceMappingURL=characterEncyclopediaRoutes.d.ts.map