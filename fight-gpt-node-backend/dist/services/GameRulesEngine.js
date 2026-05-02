"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameRulesEngine = void 0;
class GameRulesEngine {
    /**
     * Queries a specific rule by key from a list of rules
     */
    static getRuleByKey(rules, key) {
        return rules.find(r => r.key.toLowerCase() === key.toLowerCase());
    }
    /**
     * Validates if a rule has the expected structure
     */
    static validateRule(rule) {
        if (!rule.key || typeof rule.key !== 'string')
            return false;
        if (rule.value === undefined)
            return false;
        if (!rule.ui_type || typeof rule.ui_type !== 'string')
            return false;
        return true;
    }
    /**
     * Validates all rules in an array
     */
    static validateRules(rules) {
        if (!Array.isArray(rules))
            return false;
        return rules.every(rule => this.validateRule(rule));
    }
    /**
     * Evaluates if a specific rule condition is met based on the provided state
     * @param rules - Array of game rules to evaluate against
     * @param key - The rule key to look up
     * @param expectedValue - The value to check against
     */
    static evaluateCondition(rules, key, expectedValue) {
        const rule = this.getRuleByKey(rules, key);
        if (!rule)
            return false;
        // Simple equality check for now (can be expanded for complex logic like >=, regex, etc.)
        return rule.value === expectedValue;
    }
    /**
     * Extracts combined game rules context (global mechanics + character-specific rules)
     */
    static getCombinedRules(metadata, characterData) {
        const combinedRules = [...(metadata.global_mechanics || [])];
        if (characterData && characterData.game_rules) {
            combinedRules.push(...characterData.game_rules);
        }
        return combinedRules;
    }
    /**
     * Checks if the game constants allow a specific mechanic type
     */
    static validateMechanicForFormat(mechanic, constants) {
        if (!constants)
            return false;
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
exports.GameRulesEngine = GameRulesEngine;
exports.default = GameRulesEngine;
//# sourceMappingURL=GameRulesEngine.js.map