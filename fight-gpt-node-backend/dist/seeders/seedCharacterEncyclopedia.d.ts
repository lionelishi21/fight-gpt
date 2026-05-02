/**
 * Character Encyclopedia Seeder
 * Converts existing SF6 character data to CharacterEncyclopedia format
 * Seeds the database with comprehensive movesets and game rules
 */
import { CreateCharacterEncyclopediaRequest, Move, GameRule } from '../types/characterEncyclopedia';
/**
 * Generate input notation for a move (simplified - would need actual input data)
 */
export declare function generateInputNotation(moveName: string, characterName: string, category: Move['category']): string;
/**
 * Generate how_to_perform description
 */
export declare function generateHowToPerform(moveName: string, characterName: string, category: Move['category']): string;
/**
 * Get game rules for SF6 characters
 */
export declare function getSF6GameRules(characterName: string): GameRule[];
/**
 * Convert Character to CharacterEncyclopedia format
 */
export declare function convertCharacterToEncyclopedia(character: any): Promise<CreateCharacterEncyclopediaRequest | null>;
/**
 * Main seeder function
 */
declare function seedCharacterEncyclopedia(): Promise<void>;
export { seedCharacterEncyclopedia };
//# sourceMappingURL=seedCharacterEncyclopedia.d.ts.map