import { IGameMetadata, GameRule as CharacterGameRule } from '../types/gameMetadata';
import { ICharacterEncyclopedia } from '../types/characterEncyclopedia';
/**
 * AI Context Helper
 * Formats game metadata, character rules, and movesets for AI prompts
 */
/**
 * Formatted game metadata for AI prompt
 */
export interface FormattedGameMetadata {
    constantsText: string;
    globalMechanicsText: string;
    fullContextText: string;
}
/**
 * Formatted character game rules for AI prompt
 */
export interface FormattedCharacterRules {
    rulesText: string;
    hasRules: boolean;
}
/**
 * Format GameMetadata for AI prompts
 * Converts structured data into human-readable text for the AI model
 */
export declare function formatGameMetadataForAI(metadata: IGameMetadata | null): FormattedGameMetadata;
/**
 * Format character game rules for AI prompts
 * Converts character-specific rules into human-readable text
 */
export declare function formatCharacterGameRulesForAI(rules: CharacterGameRule[] | null | undefined, characterLabel?: string): FormattedCharacterRules;
/**
 * Format character moveset for AI prompts
 */
export declare function formatCharacterMovesetForAI(encyclopedia: ICharacterEncyclopedia | null | undefined, characterLabel?: string): string;
/**
 * Format full game context for AI prompt
 * Combines game metadata and character rules into a single formatted string
 */
export declare function formatFullGameContextForAI(gameMetadata: IGameMetadata | null, p1Rules: CharacterGameRule[] | null | undefined, p2Rules: CharacterGameRule[] | null | undefined, p1Encyclopedia?: ICharacterEncyclopedia | null, p2Encyclopedia?: ICharacterEncyclopedia | null): string;
/**
 * Format game constants as a simple key-value list for AI
 */
export declare function formatGameConstantsForAI(constants: Record<string, unknown> | undefined | null): string;
//# sourceMappingURL=aiContextHelper.d.ts.map