# CharacterEncyclopedia Usage Guide

The `CharacterEncyclopedia` system stores detailed, per-character knowledge. While `GameMetadata` stores universal mechanics (like how the Drive System works in SF6), the `CharacterEncyclopedia` stores specific applications, rules, move lists, and strategies for a given character.

## Core Concepts

*   **Game ID (`game_id`) & Character ID (`character_id`)**: The composite key that uniquely identifies the character within a specific game (e.g., `game_id: "sf6"`, `character_id: "ryu"`).
*   **Version (`version`)**: The patch or season version of the game (e.g., `"1.0.0"`).
*   **Current Flag (`is_current`)**: A boolean indicating if this is the active encyclopedia for the character. The AI service relies on this flag.
*   **Game Rules (`game_rules`)**: Specific, unique mechanics for this character (e.g., Ryu's Denjin Charge, Jamie's Drink Level, Zato's Eddie gauge).
*   **Movelist (`moves`)**: A structured list of the character's normals, command normals, specials, and supers, including frame data if available.
*   **Strategy (`strategy`)**: High-level text describing strengths, weaknesses, and general game plans.

## Usage Examples

### Fetching Context for AI Analysis

The AI service fetches specific character rules when a player requests an analysis of their gameplay. It combines this with the `GameMetadata`.

```typescript
// Fetch just the specific rules for Ryu in SF6
const rules = await characterEncyclopediaService.getGameRules('sf6', 'ryu');

// Combine the extracted rules into the larger prompt context
const formattedRules = formatCharacterGameRulesForAI('ryu', rules);
```

### Creating an Encyclopedia Entry

When a new DLC character is released or a game is added to the platform, a new entry is required.

```typescript
const request: CreateCharacterEncyclopediaRequest = {
  version: "1.0.0",
  is_current: true,
  game_rules: [
    {
      rule_name: "Install Super",
      description: "Changes property of all specials for 8 seconds."
    }
  ],
  moves: {
    normals: [...],
    specials: [...],
    supers: [...]
  },
  strategy: {
    strengths: ["High damage output", "Unbeatable anti-air"],
    weaknesses": ["Slow walk speed"]
  }
};

await characterEncyclopediaService.createEncyclopedia('ggst', 'ky', request);
```

### AI Context Interpretation

The AI requires explicit knowledge of character constraints. For example:
- If analyzing Jamie from SF6, the AI must know what his current Drink Level is (tracked loosely in video analysis, but the encyclopedia provides the rules on *what* changes per level).
- If analyzing a character in a tag game, the analyzer uses the `strategy` and `game_rules` to evaluate team synergy and assist usage.
