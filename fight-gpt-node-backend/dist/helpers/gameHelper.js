"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameHelper = void 0;
/**
 * Game helper class
 * Follows Single Responsibility Principle - provides utility functions for game operations
 */
class GameHelper {
    /**
     * Normalize game_id to lowercase with underscores
     * Example: "Street Fighter 6" -> "street_fighter_6"
     */
    static normalizeGameId(name) {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '') // Remove special characters
            .trim()
            .replace(/\s+/g, '_') // Replace spaces with underscores
            .replace(/_+/g, '_') // Replace multiple underscores with single
            .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
    }
    /**
     * Validate game_id format
     */
    static validateGameId(gameId) {
        const gameIdRegex = /^[a-z0-9_]+$/;
        return gameIdRegex.test(gameId);
    }
    /**
     * Format game name for display
     */
    static formatGameName(name) {
        return name
            .split(/[_\s]+/)
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }
    /**
     * Generate game slug from name
     */
    static generateSlug(name) {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .trim()
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    }
    /**
     * Check if game is active/supported
     */
    static isGameActive(isActive) {
        return isActive === true;
    }
    /**
     * Format platform array for display
     */
    static formatPlatforms(platforms) {
        if (!platforms || platforms.length === 0) {
            return 'N/A';
        }
        return platforms.join(', ');
    }
    /**
     * Get platform abbreviations
     */
    static getPlatformAbbreviations(platforms) {
        const abbreviations = {
            'PlayStation 5': 'PS5',
            'PlayStation 4': 'PS4',
            'Xbox Series X': 'XSX',
            'Xbox Series S': 'XSS',
            'Xbox One': 'XB1',
            'PC': 'PC',
            'Nintendo Switch': 'NS',
            'Steam Deck': 'SD',
        };
        return platforms.map((platform) => abbreviations[platform] || platform.toUpperCase());
    }
}
exports.GameHelper = GameHelper;
//# sourceMappingURL=gameHelper.js.map