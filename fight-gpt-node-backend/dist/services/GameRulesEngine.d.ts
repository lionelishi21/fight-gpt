import { GameRule, IGameMetadata } from '../types/gameMetadata';
import { ICharacterEncyclopedia } from '../types/characterEncyclopedia';
export declare class GameRulesEngine {
    /**
     * Queries a specific rule by key from a list of rules
     */
    static getRuleByKey(rules: GameRule[], key: string): GameRule | undefined;
    /**
     * Validates if a rule has the expected structure
     */
    static validateRule(rule: Partial<GameRule>): boolean;
    /**
     * Validates all rules in an array
     */
    static validateRules(rules: any[]): boolean;
    /**
     * Evaluates if a specific rule condition is met based on the provided state
     * @param rules - Array of game rules to evaluate against
     * @param key - The rule key to look up
     * @param expectedValue - The value to check against
     */
    static evaluateCondition(rules: GameRule[], key: string, expectedValue: unknown): boolean;
    /**
     * Extracts combined game rules context (global mechanics + character-specific rules)
     */
    static getCombinedRules(metadata: IGameMetadata, characterData?: ICharacterEncyclopedia): GameRule[];
    /**
     * Checks if the game constants allow a specific mechanic type
     */
    static validateMechanicForFormat(mechanic: string, constants: IGameMetadata['constants']): boolean;
}
export default GameRulesEngine;
//# sourceMappingURL=GameRulesEngine.d.ts.map