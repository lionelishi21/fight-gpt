# AI Context Formatting Guide

This document explains how game metadata and character rules are formatted for AI prompts in the Fight GPT system.

## Overview

The AI analysis service receives structured game context data to better understand fighting game mechanics and provide accurate coaching feedback. This context is formatted into human-readable text that can be included in AI prompts.

## Game Metadata Format

Game metadata includes global game constants and mechanics that apply to all characters in a game.

### Constants

Game constants are formatted as key-value pairs:

```
Team Size: 3 (Team-based)
Air Dash: Available
3D Movement: Available (Sidestep/Dodge)
Assists: Available
DHC (Delayed Hyper Combo): Available
Team Supers: Available
Max Meter: 5
```

### Global Mechanics

Global mechanics are formatted as a list with descriptions:

```
- Heat System: {"duration": 15} (Timed buff system for aggressive play)
- Sidestep: Z-axis (Lateral movement to evade attacks)
- Rage Drive: {"cost": 50} (Critical comeback mechanic)
```

## Character Game Rules Format

Character-specific rules are formatted for each player:

```
PLAYER 1 GAME RULES:
- Drive Gauge: 6 [Type: meter] (Resource for special moves and defensive options)
- Burnout: false [Type: state] (Penalty state with increased blockstun)
- Stun: 0 [Type: number] (Stun gauge value)

PLAYER 2 GAME RULES:
- V-Trigger: 1 [Type: meter] (Super mode activation)
- Critical Art Ready: true [Type: boolean] (Can perform super move)
```

## Full Context Format

The complete game context combines all metadata and rules:

```
---

GAME CONTEXT:
Team Size: 3 (Team-based)
Air Dash: Available
3D Movement: Available (Sidestep/Dodge)
Assists: Available
DHC (Delayed Hyper Combo): Available
Team Supers: Available
Max Meter: 5

GLOBAL MECHANICS:
- Heat System: {"duration": 15} (Timed buff system)
- Team Synergy: {"bonus": 1.2} (Team combo damage multiplier)

PLAYER 1 GAME RULES:
- Drive Gauge: 4 [Type: meter] (Resource management)
- Burnout: false [Type: state] (Penalty state)

PLAYER 2 GAME RULES:
- V-Trigger: 2 [Type: meter] (Super mode)
- Critical Art Ready: true [Type: boolean] (Super move available)

---
```

## Usage in AI Service

The formatted context is included in the `AnalysisRequest` as:

1. **Structured Data** (`game_metadata` and `character_game_rules`):
   - Used for programmatic processing
   - Maintains type safety
   - Can be used for conditional logic

2. **Formatted Text** (`game_context_text`):
   - Human-readable format
   - Ready to include in AI prompts
   - Provides context without additional processing

### Example Integration in Python AI Service

```python
def generate_prompt_with_context(video_file, game_context_text: str = None):
    base_prompt = load_base_coach_prompt()
    
    if game_context_text:
        full_prompt = f"{base_prompt}\n\n{game_context_text}\n\nUse this game context to provide accurate coaching feedback."
    else:
        full_prompt = base_prompt
    
    return full_prompt
```

## Game-Specific Examples

### Street Fighter 6 (SF6)
```
GAME CONTEXT:
Team Size: 1 (1v1)
Air Dash: Not available
3D Movement: 2D only
Assists: Not available
DHC (Delayed Hyper Combo): Not available
Team Supers: Not available
Max Meter: 6

GLOBAL MECHANICS:
- Drive Gauge: 6 (System gauge for Drive Rush, Parry, Impact)
- Drive Impact: {"armor": true} (Armored attack that can absorb hits)
- Burnout: {"blockstun": 4} (Penalty state with increased blockstun)

PLAYER 1 GAME RULES:
- Drive Gauge: 3 [Type: meter] (Current Drive Gauge level)
- Burnout: false [Type: state] (Not in Burnout state)
```

### Tekken 8
```
GAME CONTEXT:
Team Size: 1 (1v1)
Air Dash: Not available
3D Movement: Available (Sidestep/Dodge)
Assists: Not available
DHC (Delayed Hyper Combo): Not available
Team Supers: Not available
Max Meter: 2

GLOBAL MECHANICS:
- Heat System: {"duration": 15} (Timed aggressive state)
- Heat Burst: {"damage": true} (Chip damage on block)
- Sidestep: Z-axis (Lateral movement)

PLAYER 1 GAME RULES:
- Heat State: true [Type: boolean] (Currently in Heat)
- Heat Timer: 8 [Type: number] (Seconds remaining in Heat)
```

### Ultimate Marvel vs Capcom 3 (UMVC3)
```
GAME CONTEXT:
Team Size: 3 (Team-based)
Air Dash: Available
3D Movement: Not available
Assists: Available
DHC (Delayed Hyper Combo): Available
Team Supers: Available
Max Meter: 5

GLOBAL MECHANICS:
- X-Factor: {"multiplier": 1.5} (Comeback mechanic with damage boost)
- Team Synergy: {"bonus": 1.2} (Team combo damage multiplier)
- Happy Birthday: {"double_hit": true} (Hitting multiple characters at once)

PLAYER 1 GAME RULES:
- X-Factor Level: 3 [Type: number] (Highest level)
- Active Character: wolverine [Type: string] (Current point character)
- Assist Alpha: doom [Type: string] (First assist character)
```

## Helper Functions

### `formatGameMetadataForAI(metadata: IGameMetadata | null)`

Formats game metadata constants and global mechanics into structured text.

**Returns:**
- `constantsText`: Formatted constants as bullet points
- `globalMechanicsText`: Formatted global mechanics as a list
- `fullContextText`: Combined formatted context

### `formatCharacterGameRulesForAI(rules: CharacterGameRule[], characterLabel: string)`

Formats character-specific game rules into readable text.

**Returns:**
- `rulesText`: Formatted rules with descriptions
- `hasRules`: Boolean indicating if rules were found

### `formatFullGameContextForAI(gameMetadata, p1Rules, p2Rules)`

Combines all game context into a single formatted string ready for AI prompts.

**Returns:** Complete formatted context string or empty string if no context available.

## Best Practices

1. **Always include game context when `game_id` is provided** - This improves AI accuracy
2. **Include character IDs when known** - Character-specific rules provide better coaching
3. **Handle missing data gracefully** - Continue analysis even if metadata is unavailable
4. **Use formatted text for prompts** - The `game_context_text` field is ready to use
5. **Preserve structured data** - Keep `game_metadata` and `character_game_rules` for programmatic use

## Testing

Test the formatting with different game types:

1. **SF6 (1v1, 2D)** - Should show Drive Gauge, Burnout mechanics
2. **Tekken 8 (1v1, 3D)** - Should show Heat System, Sidestep mechanics
3. **UMVC3 (Team-based)** - Should show Team Size: 3, Assists, DHC mechanics


