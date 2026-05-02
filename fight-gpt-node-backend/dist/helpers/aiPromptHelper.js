"use strict";
/**
 * AI Prompt Helper - "Sensei Logic" Bridge
 *
 * Converts raw database objects (Characters, Moves, Game Rules) into a
 * high-level "Coaching Prompt" that Gemini can understand.
 *
 * This is the "Cheat Sheet" formatter that minimizes token usage while
 * maximizing AI understanding of fighting game mechanics.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiPromptHelper = void 0;
const aiContextHelper_1 = require("./aiContextHelper");
/**
 * AI Prompt Helper Class
 * Formats Game Metadata and Character Movesets into a "Cheat Sheet" for Gemini
 */
class AiPromptHelper {
    /**
     * Formats Game Metadata and Character Movesets into a "Cheat Sheet" for Gemini.
     * This creates a hierarchical text format that minimizes token usage while maximizing AI understanding.
     *
     * @param gameMetadata - Game metadata with global mechanics and constants
     * @param characterData - Array of character encyclopedia data (movesets, rules)
     * @returns Formatted context string ready for AI prompt
     */
    static formatAnalysisContext(gameMetadata, characterData) {
        const parts = [];
        // 1. Game Rules Header
        if (gameMetadata) {
            const gameId = gameMetadata.game_id.toUpperCase();
            const version = gameMetadata.patch_version || 'latest';
            parts.push(`### GAME RULES: ${gameId} (v${version})\n`);
            // Format game metadata using existing helper
            const formattedMetadata = (0, aiContextHelper_1.formatGameMetadataForAI)(gameMetadata);
            // Add constants
            if (formattedMetadata.constantsText) {
                parts.push('GAME CONSTANTS:');
                parts.push(formattedMetadata.constantsText);
                parts.push('');
            }
            // Add global mechanics
            if (formattedMetadata.globalMechanicsText) {
                parts.push('GLOBAL MECHANICS:');
                parts.push(formattedMetadata.globalMechanicsText);
                parts.push('');
            }
        }
        // 2. Character Move Encyclopedia
        if (characterData.length > 0) {
            parts.push('### CHARACTER MOVE ENCYCLOPEDIA:\n');
            characterData.forEach((char) => {
                const charName = char.character_name || char.character_id.toUpperCase();
                parts.push(`\nCHARACTER: ${charName}\n`);
                // Character-specific game rules
                if (char.game_rules && char.game_rules.length > 0) {
                    const formattedRules = (0, aiContextHelper_1.formatCharacterGameRulesForAI)(char.game_rules, charName);
                    if (formattedRules.hasRules) {
                        parts.push(formattedRules.rulesText);
                        parts.push('');
                    }
                }
                // Specials, EX Moves, and Supers are most important for analysis
                const categories = [
                    { key: 'specials', label: 'SPECIALS' },
                    { key: 'ex_moves', label: 'EX MOVES' },
                    { key: 'supers', label: 'SUPERS' },
                ];
                categories.forEach(({ key, label }) => {
                    const moves = char.moveset[key];
                    if (moves && moves.length > 0) {
                        parts.push(`  [${label}]`);
                        moves.forEach((move) => {
                            const moveLine = this.formatMoveForContext(move);
                            parts.push(`  ${moveLine}`);
                        });
                        parts.push('');
                    }
                });
                // Optionally include normals (less critical but useful)
                if (char.moveset.normals && char.moveset.normals.length > 0) {
                    parts.push('  [NORMALS]');
                    // Only include key normals (first 5-10) to save tokens
                    const keyNormals = char.moveset.normals.slice(0, 8);
                    keyNormals.forEach((move) => {
                        const moveLine = this.formatMoveForContext(move, true); // Compact format for normals
                        parts.push(`  ${moveLine}`);
                    });
                    parts.push('');
                }
            });
        }
        return parts.join('\n');
    }
    /**
     * Format a single move for context
     * Creates a compact representation with key frame data
     *
     * @param move - Move object from moveset
     * @param compact - If true, use more compact format (for normals)
     * @returns Formatted move string
     */
    static formatMoveForContext(move, compact = false) {
        const parts = [];
        // Move name
        parts.push(move.name || 'Unknown');
        // Input notation
        if (move.input) {
            parts.push(`(${move.input})`);
        }
        // Frame data (most critical for analysis)
        if (move.frame_data) {
            const fd = move.frame_data;
            const frameParts = [];
            if (fd.startup !== undefined) {
                frameParts.push(`Startup:${fd.startup}`);
            }
            if (fd.on_block !== undefined) {
                // Highlight unsafe moves (negative on block)
                const onBlock = fd.on_block;
                if (onBlock < 0) {
                    frameParts.push(`OnBlock:${onBlock}⚠️`);
                }
                else {
                    frameParts.push(`OnBlock:${onBlock}`);
                }
            }
            if (!compact && fd.active !== undefined) {
                frameParts.push(`Active:${fd.active}`);
            }
            if (!compact && fd.recovery !== undefined) {
                frameParts.push(`Recovery:${fd.recovery}`);
            }
            if (frameParts.length > 0) {
                parts.push(`[${frameParts.join(', ')}]`);
            }
        }
        // Properties (e.g., "High", "Armor", "Projectile")
        if (!compact && move.properties && move.properties.length > 0) {
            parts.push(`{${move.properties.join(', ')}}`);
        }
        return `- ${parts.join(' ')}`;
    }
    /**
     * Format full analysis context including game metadata and character data
     * This is the main entry point for creating the "Cheat Sheet"
     *
     * @param gameMetadata - Game metadata
     * @param p1Character - Player 1 character data
     * @param p2Character - Player 2 character data (optional)
     * @returns Complete formatted context string
     */
    static formatFullAnalysisContext(gameMetadata, p1Character, p2Character) {
        const characterData = [];
        if (p1Character) {
            characterData.push(p1Character);
        }
        if (p2Character) {
            characterData.push(p2Character);
        }
        return this.formatAnalysisContext(gameMetadata, characterData);
    }
    /**
     * Create a condensed "Quick Reference" version for token efficiency
     * Only includes the most critical moves and frame data
     *
     * @param gameMetadata - Game metadata
     * @param characterData - Character data array
     * @returns Condensed context string
     */
    static formatCondensedContext(gameMetadata, characterData) {
        // For now, use the full format but could be optimized further
        // by only including moves with frame data and excluding normals
        return this.formatAnalysisContext(gameMetadata, characterData);
    }
}
exports.AiPromptHelper = AiPromptHelper;
//# sourceMappingURL=aiPromptHelper.js.map