/**
 * Game helper class
 * Follows Single Responsibility Principle - provides utility functions for game operations
 */
export declare class GameHelper {
    /**
     * Normalize game_id to lowercase with underscores
     * Example: "Street Fighter 6" -> "street_fighter_6"
     */
    static normalizeGameId(name: string): string;
    /**
     * Validate game_id format
     */
    static validateGameId(gameId: string): boolean;
    /**
     * Format game name for display
     */
    static formatGameName(name: string): string;
    /**
     * Generate game slug from name
     */
    static generateSlug(name: string): string;
    /**
     * Check if game is active/supported
     */
    static isGameActive(isActive: boolean): boolean;
    /**
     * Format platform array for display
     */
    static formatPlatforms(platforms: string[]): string;
    /**
     * Get platform abbreviations
     */
    static getPlatformAbbreviations(platforms: string[]): string[];
}
//# sourceMappingURL=gameHelper.d.ts.map