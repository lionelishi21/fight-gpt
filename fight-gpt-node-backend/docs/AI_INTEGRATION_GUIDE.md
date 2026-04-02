# AI Integration Guide

This guide explains how `GameMetadata` and `CharacterEncyclopedia` are consumed by the AI service to provide contextualized, accurate gameplay analysis.

## Overview

The AI analysis service takes a video round and evaluates a player's performance. By itself, the AI might recognize a "punch" or a "block", but it wouldn't know the specific rules of the game (e.g., that blocking too much in SF6 leads to Burnout, or that sidestepping in Tekken 8 avoids linear attacks).

We solve this by injecting game-specific rules into the prompt before analysis.

## The Context Assembly Pipeline

When an analysis request is made, the `AnalysisService` does the following:

1.  **Extracts Identifiers**: Reads the `game_id` and the `character_id`(s) from the request.
2.  **Fetches GameMetadata**: Calls `GameMetadataService.getCurrentGameMetadataByGameId(game_id)`.
3.  **Fetches Character Rules**: Calls `CharacterEncyclopediaService.getGameRules(game_id, character_id)`.
4.  **Formats the Context**: Passes this data through helper functions (e.g., `formatFullGameContextForAI()`).
5.  **Injects into Prompt**: The formatted context is appended to the `coach_system_prompt.txt` before being sent to the LLM.

## Prompt Injection Example

The helper functions convert JSON database records into human-readable text optimized for the LLM.

**Raw Data (From MongoDB):**
```json
{
  "game_id": "sf6",
  "mechanic_name": "Drive Parry",
  "description": "Hold MP+MK to parry attacks. Replenishes Drive Gauge on success."
}
```

**Formatted Output (Injected into Prompt):**
```text
[GAME CONTEXT: sf6]
Global Mechanics:
- Drive Parry: Hold MP+MK to parry attacks. Replenishes Drive Gauge on success.

[CHARACTER RULES: ryu]
- Denjin Charge: Ryu can charge his fireballs and Hashogeki.
```

## Examples by Game Type

### 1. Street Fighter 6 (2D Fighter)
*   **Constants**: `team_size: 1`, `has_3d_movement: false`.
*   **Global Mechanics**: The AI prompt is instructed to look for Drive Gauge management. If a player is in Burnout, the AI must evaluate if they took unnecessary risks or if they lacked defense.
*   **Character Rules**: If the player is using Jamie, the AI is instructed to evaluate Drink Level management. The prompt explains that Jamie gains new moves at levels 1-4.

### 2. Tekken 8 (3D Fighter)
*   **Constants**: `team_size: 1`, `has_3d_movement: true`.
*   **Global Mechanics**: The AI prompt is instructed to look for 3D spatial awareness (sidesteps, sidewalking) and the Heat System.
*   **Character Rules**: If the player is using King, the AI is instructed to look for chain grab setups or specific stance transitions (e.g., Jaguar Sprint).

### 3. Ultimate Marvel vs Capcom 3 (Team Fighter)
*   **Constants**: `team_size: 3`, `has_3d_movement: false`.
*   **Global Mechanics**: The AI prompt is instructed to look for team synergy, assist calls, and Delayed Hyper Combos (DHCs). It evaluates the health of the entire team, not just the point character.
*   **Character Rules**: The AI analyzes the specific assists equipped by the team and evaluates if they were used effectively (e.g., checking if a standard projectile assist was used to cover an approach).
