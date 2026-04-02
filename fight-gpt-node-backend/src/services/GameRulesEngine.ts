import { GameRule, IGameMetadata } from '../types/gameMetadata';
import { ICharacterEncyclopedia } from '../types/characterEncyclopedia';

export class GameRulesEngine {
    /**
     * Queries a specific rule by key from a list of rules
     */
    public static getRuleByKey(rules: GameRule[], key: string): GameRule | undefined {
        return rules.find(r => r.key.toLowerCase() === key.toLowerCase());
    }

    /**
     * Validates if a rule has the expected structure
     */
    public static validateRule(rule: Partial<GameRule>): boolean {
        if (!rule.key || typeof rule.key !== 'string') return false;
        if (rule.value === undefined) return false;
        if (!rule.ui_type || typeof rule.ui_type !== 'string') return false;
        return true;
    }

    /**
     * Validates all rules in an array
     */
    public static validateRules(rules: any[]): boolean {
        if (!Array.isArray(rules)) return false;
        return rules.every(rule => this.validateRule(rule));
    }

    /**
     * Evaluates if a specific rule condition is met based on the provided state
     * @param rules - Array of game rules to evaluate against
     * @param key - The rule key to look up
     * @param expectedValue - The value to check against
     */
    public static evaluateCondition(rules: GameRule[], key: string, expectedValue: unknown): boolean {
        const rule = this.getRuleByKey(rules, key);
        if (!rule) return false;

        // Simple equality check for now (can be expanded for complex logic like >=, regex, etc.)
        return rule.value === expectedValue;
    }

    /**
     * Extracts combined game rules context (global mechanics + character-specific rules)
     */
    public static getCombinedRules(metadata: IGameMetadata, characterData?: ICharacterEncyclopedia): GameRule[] {
        const combinedRules = [...(metadata.global_mechanics || [])];
        if (characterData && characterData.game_rules) {
            combinedRules.push(...characterData.game_rules);
        }
        return combinedRules;
    }

    /**
     * Checks if the game constants allow a specific mechanic type
     */
    public static validateMechanicForFormat(mechanic: string, constants: IGameMetadata['constants']): boolean {
        if (!constants) return false;
        switch (mechanic) {
            case 'assist': return !!constants.has_assists;
            case 'dhc': return !!constants.has_dhc;
            case 'team_super': return !!constants.has_team_supers;
            case 'air_dash': return !!constants.has_air_dash;
            case '3d_movement': return !!constants.has_3d_movement;
            default: return false;
        }
    }
}

export default GameRulesEngine;
