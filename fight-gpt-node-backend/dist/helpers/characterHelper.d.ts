import { CharacterMove, CharacterStats, MoveTag } from '../types/character';
/**
 * Character helper class
 * Follows Single Responsibility Principle - provides utility functions for character operations
 */
export declare class CharacterHelper {
    /**
     * Validate move structure
     */
    static validateMove(move: CharacterMove): boolean;
    /**
     * Validate stats structure
     */
    static validateStats(stats: CharacterStats): boolean;
    /**
     * Get move by ID from moves array
     */
    static getMoveById(moves: CharacterMove[], moveId: string): CharacterMove | undefined;
    /**
     * Filter moves by tags
     */
    static filterMovesByTags(moves: CharacterMove[], tags: MoveTag[]): CharacterMove[];
    /**
     * Get moves with specific property range
     */
    static getMovesByRange(moves: CharacterMove[], property: keyof CharacterMove, min?: number, max?: number): CharacterMove[];
    /**
     * Calculate move total frames
     */
    static getMoveTotalFrames(move: CharacterMove): number;
    /**
     * Get safe moves (on_block >= 0)
     */
    static getSafeMoves(moves: CharacterMove[]): CharacterMove[];
    /**
     * Get unsafe moves (on_block < 0)
     */
    static getUnsafeMoves(moves: CharacterMove[]): CharacterMove[];
    /**
     * Get punishable moves (on_block <= -5)
     */
    static getPunishableMoves(moves: CharacterMove[]): CharacterMove[];
    /**
     * Sort moves by property
     */
    static sortMovesBy(moves: CharacterMove[], property: keyof CharacterMove, order?: 'asc' | 'desc'): CharacterMove[];
    /**
     * Calculate average frame data
     */
    static getAverageFrameData(moves: CharacterMove[]): {
        avgStartup: number;
        avgActive: number;
        avgRecovery: number;
        avgOnBlock: number;
    };
    /**
     * Format character name for display
     */
    static formatCharacterName(name: string): string;
    /**
     * Generate character slug from name
     */
    static generateSlug(name: string): string;
}
//# sourceMappingURL=characterHelper.d.ts.map