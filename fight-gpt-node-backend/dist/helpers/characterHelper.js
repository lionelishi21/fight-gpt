"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CharacterHelper = void 0;
/**
 * Character helper class
 * Follows Single Responsibility Principle - provides utility functions for character operations
 */
class CharacterHelper {
    /**
     * Validate move structure
     */
    static validateMove(move) {
        if (!move.id || typeof move.id !== 'string')
            return false;
        if (!move.name || typeof move.name !== 'string')
            return false;
        if (typeof move.startup !== 'number')
            return false;
        if (typeof move.active !== 'number')
            return false;
        if (typeof move.recovery !== 'number')
            return false;
        if (typeof move.on_block !== 'number')
            return false;
        if (!Array.isArray(move.tags))
            return false;
        return true;
    }
    /**
     * Validate stats structure
     */
    static validateStats(stats) {
        if (!stats || typeof stats !== 'object')
            return false;
        return true;
    }
    /**
     * Get move by ID from moves array
     */
    static getMoveById(moves, moveId) {
        return moves.find((move) => move.id === moveId);
    }
    /**
     * Filter moves by tags
     */
    static filterMovesByTags(moves, tags) {
        return moves.filter((move) => tags.some((tag) => move.tags.includes(tag)));
    }
    /**
     * Get moves with specific property range
     */
    static getMovesByRange(moves, property, min, max) {
        return moves.filter((move) => {
            const value = move[property];
            if (typeof value !== 'number')
                return false;
            if (min !== undefined && value < min)
                return false;
            if (max !== undefined && value > max)
                return false;
            return true;
        });
    }
    /**
     * Calculate move total frames
     */
    static getMoveTotalFrames(move) {
        return move.startup + move.active + move.recovery;
    }
    /**
     * Get safe moves (on_block >= 0)
     */
    static getSafeMoves(moves) {
        return moves.filter((move) => move.on_block >= 0);
    }
    /**
     * Get unsafe moves (on_block < 0)
     */
    static getUnsafeMoves(moves) {
        return moves.filter((move) => move.on_block < 0);
    }
    /**
     * Get punishable moves (on_block <= -5)
     */
    static getPunishableMoves(moves) {
        return moves.filter((move) => move.on_block <= -5);
    }
    /**
     * Sort moves by property
     */
    static sortMovesBy(moves, property, order = 'asc') {
        const sorted = [...moves].sort((a, b) => {
            const aVal = a[property];
            const bVal = b[property];
            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return order === 'asc' ? aVal - bVal : bVal - aVal;
            }
            if (typeof aVal === 'string' && typeof bVal === 'string') {
                return order === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
            }
            return 0;
        });
        return sorted;
    }
    /**
     * Calculate average frame data
     */
    static getAverageFrameData(moves) {
        if (moves.length === 0) {
            return {
                avgStartup: 0,
                avgActive: 0,
                avgRecovery: 0,
                avgOnBlock: 0,
            };
        }
        const total = moves.reduce((acc, move) => ({
            startup: acc.startup + move.startup,
            active: acc.active + move.active,
            recovery: acc.recovery + move.recovery,
            onBlock: acc.onBlock + move.on_block,
        }), { startup: 0, active: 0, recovery: 0, onBlock: 0 });
        return {
            avgStartup: total.startup / moves.length,
            avgActive: total.active / moves.length,
            avgRecovery: total.recovery / moves.length,
            avgOnBlock: total.onBlock / moves.length,
        };
    }
    /**
     * Format character name for display
     */
    static formatCharacterName(name) {
        return name
            .split('_')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }
    /**
     * Generate character slug from name
     */
    static generateSlug(name) {
        return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    }
}
exports.CharacterHelper = CharacterHelper;
//# sourceMappingURL=characterHelper.js.map