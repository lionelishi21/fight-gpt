import { Router } from 'express';
import { CharacterController } from '../controllers/CharacterController';
/**
 * Character routes
 * Follows Single Responsibility Principle - handles routing for character endpoints
 */
export declare class CharacterRoutes {
    private router;
    private controller;
    constructor(controller: CharacterController);
    /**
     * Setup routes
     */
    private setupRoutes;
    /**
     * Get router instance
     */
    getRouter(): Router;
    /**
     * Validation rules for create character
     */
    private validateCreateCharacter;
    /**
     * Validation rules for update character
     */
    private validateUpdateCharacter;
    /**
     * Validation rules for ID parameter
     */
    private validateId;
    /**
     * Validation rules for gameId parameter
     */
    private validateGameId;
    /**
     * Validation rules for gameId and name parameters
     */
    private validateGameIdAndName;
    /**
     * Validation rules for gameId and version parameters
     */
    private validateGameIdAndVersion;
    /**
     * Validation rules for find characters query
     */
    private validateFindCharacters;
    /**
     * Validation rules for search characters query
     */
    private validateSearchCharacters;
    /**
     * Validation rules for set current
     */
    private validateSetCurrent;
}
//# sourceMappingURL=characterRoutes.d.ts.map