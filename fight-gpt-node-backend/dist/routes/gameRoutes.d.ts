import { Router } from 'express';
import { GameController } from '../controllers/GameController';
/**
 * Game routes
 * Follows Single Responsibility Principle - handles routing for game endpoints
 */
export declare class GameRoutes {
    private router;
    private controller;
    constructor(controller: GameController);
    /**
     * Setup routes
     */
    private setupRoutes;
    /**
     * Get router instance
     */
    getRouter(): Router;
    /**
     * Validation rules for create game
     */
    private validateCreateGame;
    /**
     * Validation rules for update game
     */
    private validateUpdateGame;
    /**
     * Validation rules for ID parameter
     */
    private validateId;
    /**
     * Validation rules for gameId parameter
     */
    private validateGameId;
    /**
     * Validation rules for find games query
     */
    private validateFindGames;
    /**
     * Validation rules for search games query
     */
    private validateSearchGames;
}
//# sourceMappingURL=gameRoutes.d.ts.map