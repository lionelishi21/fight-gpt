# Sensei Logic Bridge - Implementation Summary

## Overview

The "Sensei Logic" bridge converts raw database objects (Characters, Moves, Game Rules) into a high-level "Coaching Prompt" that Gemini can understand. This system creates a "Cheat Sheet" format that minimizes token usage while maximizing AI understanding.

## Architecture

```
Database (MongoDB)
    ↓
Node.js Backend (AnalysisService)
    ↓
AiPromptHelper.formatFullAnalysisContext()
    ↓
"Cheat Sheet" (ai_context field)
    ↓
Python AI Service (FastAPI)
    ↓
Gemini 1.5 Pro
    ↓
Structured Coaching Analysis
```

## Components

### 1. AiPromptHelper (`src/helpers/aiPromptHelper.ts`)

**Purpose:** Formats Game Metadata and Character Movesets into a "Cheat Sheet" for Gemini.

**Key Methods:**
- `formatAnalysisContext()` - Main formatter that creates the hierarchical text format
- `formatFullAnalysisContext()` - Entry point that combines game metadata and character data
- `formatMoveForContext()` - Formats individual moves with frame data

**Output Format:**
```
### GAME RULES: SF6 (v1.05)

GAME CONSTANTS:
- Team Size: 1 (1v1)
- Air Dash: Not available
- 3D Movement: 2D only
...

GLOBAL MECHANICS:
- Drive Gauge: 6 (System gauge used for Drive Rush, Drive Parry...)
- Drive Impact: {"armor": true, "guard_crush": true} (Armored attack...)
...

### CHARACTER MOVE ENCYCLOPEDIA:

CHARACTER: RYU

- Drive Gauge: 6 [Type: meter] (System gauge...)

  [SPECIALS]
  - Light Hadoken (236P) [Startup:10, OnBlock:-4⚠️]
  - Medium Hadoken (236MP) [Startup:12, OnBlock:-4⚠️]
  ...

  [EX MOVES]
  - EX Hadoken (236PP) [Startup:8, OnBlock:2]
  ...

  [SUPERS]
  - Shinku Hadoken (236236P) [Startup:5, OnBlock:20]
  ...
```

### 2. AnalysisService Updates (`src/services/AnalysisService.ts`)

**Enhancements:**
- Fetches full `CharacterEncyclopedia` data (movesets + rules) instead of just game rules
- Uses `AiPromptHelper` to create the enhanced "Cheat Sheet"
- Falls back to legacy format if encyclopedia data not available
- Stores both `ai_context` (new format) and `game_context_text` (legacy) for backward compatibility

**Flow:**
1. Fetch `GameMetadata` (global mechanics, constants)
2. Fetch `CharacterEncyclopedia` for P1 and P2 (full movesets + rules)
3. Format using `AiPromptHelper.formatFullAnalysisContext()`
4. Add `ai_context` field to `AnalysisRequest`
5. Send to Python AI service

### 3. Python AI Service Updates (`fight-gpt-ai/api.py`)

**Enhancements:**
- `AnalysisRequest` model now includes `ai_context` field
- `analyze_video_with_gemini()` accepts both `game_context_text` (legacy) and `ai_context` (new)
- Prefers `ai_context` over `game_context_text` if both provided
- Enhanced prompt includes instructions for using the "Cheat Sheet"

**Prompt Structure:**
```
[Pro Coach System Prompt]

---
### COACHING CHEAT SHEET
[Instructions for using the Cheat Sheet]

[Formatted ai_context with movesets]
---

[Additional instructions]
```

### 4. System Prompt Updates (`fight-gpt-ai/coach_system_prompt.txt`)

**Enhancements:**
- Updated "GAME CONTEXT" section to "GAME CONTEXT / CHEAT SHEET"
- Added instructions for:
  - Identifying moves by input notation
  - Using frame data for analysis
  - Understanding game mechanics
  - Considering character states

## Data Flow

### Request Flow

1. **Client Request:**
   ```json
   {
     "youtube_url": "https://youtube.com/watch?v=...",
     "game_id": "sf6",
     "p1_character_id": "ryu",
     "p2_character_id": "ken"
   }
   ```

2. **AnalysisService.enrichRequestWithGameContext():**
   - Fetches `GameMetadata` for `sf6`
   - Fetches `CharacterEncyclopedia` for `ryu` and `ken`
   - Formats using `AiPromptHelper`
   - Adds `ai_context` field

3. **Enriched Request:**
   ```json
   {
     "youtube_url": "https://youtube.com/watch?v=...",
     "game_id": "sf6",
     "p1_character_id": "ryu",
     "p2_character_id": "ken",
     "ai_context": "### GAME RULES: SF6 (v1.05)\n\n..."
   }
   ```

4. **Python AI Service:**
   - Receives request with `ai_context`
   - Downloads/processes video
   - Calls Gemini with enhanced prompt including Cheat Sheet
   - Returns structured analysis

## Key Features

### Token Efficiency
- Only includes critical moves (specials, EX moves, supers)
- Normals limited to first 8 (key normals only)
- Compact frame data format
- Hierarchical structure for easy parsing

### Frame Data Highlighting
- Unsafe moves marked with ⚠️ (negative on block)
- Startup, OnBlock, Active, Recovery included
- Move properties (High, Armor, Projectile) included

### Game Mechanics Integration
- Global mechanics (Drive Gauge, Heat System, etc.)
- Character-specific rules (Burnout, V-Trigger, etc.)
- Game constants (team size, movement capabilities)

### Backward Compatibility
- Legacy `game_context_text` still supported
- Falls back gracefully if `CharacterEncyclopedia` not available
- Works with just `GameMetadata` if character data missing

## Usage Example

```typescript
// In AnalysisService
const aiContext = AiPromptHelper.formatFullAnalysisContext(
  gameMetadata,      // IGameMetadata | null
  p1CharacterData,  // CharacterAnalysisData | null
  p2CharacterData   // CharacterAnalysisData | null
);

// Add to request
enrichedRequest.ai_context = aiContext;
```

## Testing

To test the Sensei Logic bridge:

1. **Ensure data is seeded:**
   ```bash
   npm run seed:game-metadata
   npm run seed:character-encyclopedia
   ```

2. **Make analysis request:**
   ```bash
   curl -X POST http://localhost:3000/api/analyze \
     -H "Content-Type: application/json" \
     -d '{
       "youtube_url": "https://youtube.com/watch?v=...",
       "game_id": "sf6",
       "p1_character_id": "ryu",
       "p2_character_id": "ken"
     }'
   ```

3. **Verify ai_context in logs:**
   - Check Node.js logs for: `[AnalysisService] Generated AI context (X chars) with movesets`
   - Check Python logs for: `📋 Enhanced AI context (Cheat Sheet) included in prompt`

## Next Steps

1. ✅ **Character Name Lookup:** Enhanced `AnalysisService` to fetch character names from `Character` model (optional dependency)
2. **Move Filtering:** Add logic to filter moves by relevance (e.g., only include moves with frame data)
3. **Token Optimization:** Further optimize format for token usage
4. **Caching:** Cache formatted `ai_context` to avoid re-formatting on every request
5. **Validation:** Add validation to ensure moveset data is complete before formatting

## Files Modified

- ✅ `src/helpers/aiPromptHelper.ts` (NEW)
- ✅ `src/services/AnalysisService.ts` (UPDATED)
- ✅ `src/types/index.ts` (UPDATED - added `ai_context` field)
- ✅ `fight-gpt-ai/api.py` (UPDATED - accepts and uses `ai_context`)
- ✅ `fight-gpt-ai/coach_system_prompt.txt` (UPDATED - Cheat Sheet instructions)
