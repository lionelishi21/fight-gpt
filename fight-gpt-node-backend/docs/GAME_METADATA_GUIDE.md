# GameMetadata Usage Guide

The `GameMetadata` system is the source of truth for all global rules, mechanics, and constants that govern a specific fighting game. This context is essential for the AI coach to understand the constraints and possibilities within a match.

## Core Concepts

*   **Game ID (`game_id`)**: A unique string identifier for the game (e.g., `"sf6"`, `"tekken8"`, `"umvc3"`).
*   **Version (`version`)**: The patch or season version of the game (e.g., `"1.0.0"`).
*   **Current Flag (`is_current`)**: A boolean indicating if this is the active metadata for the game. The AI service always queries the `current` metadata.
*   **Global Mechanics (`global_mechanics`)**: An array of objects describing universal systems (e.g., Drive Gauge in SF6, Heat System in Tekken 8).
*   **Constants (`constants`)**: Key-value pairs defining fixed rules (e.g., `team_size: 1`, `has_3d_movement: false`).

## Usage Examples

### Fetching Metadata for Analysis

When processing a video analysis request, the `AnalysisService` fetches the current metadata to provide context to the AI model.

```typescript
// Fetch the current metadata for Street Fighter 6
const metadata = await gameMetadataService.getCurrentGameMetadataByGameId('sf6');

// Extract specific constants
const isTeamGame = metadata.constants?.team_size > 1;
const has3dMovement = metadata.constants?.has_3d_movement === true;

// Pass the global mechanics to the AI context formatter
const contextText = formatGameMetadataForAI(metadata);
```

### Adding New Games

When adding support for a new game, you must create its metadata document.

```typescript
const request: CreateGameMetadataRequest = {
  game_id: "ggst",
  name: "Guilty Gear -Strive-",
  version: "1.33",
  is_current: true,
  global_mechanics: [
    {
      mechanic_name: "Roman Cancel",
      description: "Spend 50% Tension to cancel..."
    }
  ],
  constants: {
    team_size: 1,
    meter_bars: 100
  }
};

await gameMetadataService.createGameMetadata(request);
```

### Versioning and Patch Updates

When a game receives a major patch that alters mechanics, do not overwrite the existing metadata. Instead, create a new record and set it as current. The backend configuration logic handles demoting the previous current version.

1.  **POST** a new metadata document with the updated `version` and `is_current: true`.
2.  The repository or service layer will automatically handle un-flagging the old version.
