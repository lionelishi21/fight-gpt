/**
 * AI Prompt Helper - "Sensei Logic" Bridge
 *
 * Converts raw database objects (Characters, Moves, Game Rules) into a
 * high-level "Coaching Prompt" that Gemini can understand.
 *
 * This is the "Cheat Sheet" formatter that minimizes token usage while
 * maximizing AI understanding of fighting game mechanics.
 */
import { IGameMetadata } from '../types/gameMetadata';
import { Moveset } from '../types/characterEncyclopedia';
/**
 * Character data for analysis context
 */
export interface CharacterAnalysisData {
    character_id: string;
    character_name?: string;
    moveset: Moveset;
    game_rules?: Array<{
        key: string;
        value: unknown;
        ui_type: string;
        description?: string;
    }>;
}
/**
 * AI Prompt Helper Class
 * Formats Game Metadata and Character Movesets into a "Cheat Sheet" for Gemini
 */
export declare class AiPromptHelper {
    /**
     * Formats Game Metadata and Character Movesets into a "Cheat Sheet" for Gemini.
     * This creates a hierarchical text format that minimizes token usage while maximizing AI understanding.
     *
     * @param gameMetadata - Game metadata with global mechanics and constants
     * @param characterData - Array of character encyclopedia data (movesets, rules)
     * @returns Formatted context string ready for AI prompt
     */
    static formatAnalysisContext(gameMetadata: IGameMetadata | null, characterData: CharacterAnalysisData[]): string;
    /**
     * Format a single move for context
     * Creates a compact representation with key frame data
     *
     * @param move - Move object from moveset
     * @param compact - If true, use more compact format (for normals)
     * @returns Formatted move string
     */
    private static formatMoveForContext;
    /**
     * Format full analysis context including game metadata and character data
     * This is the main entry point for creating the "Cheat Sheet"
     *
     * @param gameMetadata - Game metadata
     * @param p1Character - Player 1 character data
     * @param p2Character - Player 2 character data (optional)
     * @returns Complete formatted context string
     */
    static formatFullAnalysisContext(gameMetadata: IGameMetadata | null, p1Character: CharacterAnalysisData | null, p2Character: CharacterAnalysisData | null): string;
    /**
     * Create a condensed "Quick Reference" version for token efficiency
     * Only includes the most critical moves and frame data
     *
     * @param gameMetadata - Game metadata
     * @param characterData - Character data array
     * @returns Condensed context string
     */
    static formatCondensedContext(gameMetadata: IGameMetadata | null, characterData: CharacterAnalysisData[]): string;
}
//# sourceMappingURL=aiPromptHelper.d.ts.map