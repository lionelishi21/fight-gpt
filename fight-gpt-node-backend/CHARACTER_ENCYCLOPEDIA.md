# Character Encyclopedia Model Documentation

The Character Encyclopedia model provides comprehensive moveset organization and system mechanics tracking for fighting game characters. This is designed for detailed character guides and frame data references.

## Overview

The `CharacterEncyclopedia` model provides:
- **Comprehensive Moveset Organization**: Moves organized into normals, specials, EX moves, and supers
- **Detailed Frame Data**: Complete frame data with startup, active, recovery, on_block, etc.
- **Input Notation**: Move inputs (e.g., "236P") with how-to-perform descriptions and button press arrays
- **System Mechanics**: Game-specific mechanics like Burnout, Drive Gauge, Stun with penalties and costs
- **Version/Patch Tracking**: Legacy movesets stored for historical reference alongside current patches

## Schema Structure

### Character Encyclopedia Fields

- **`game_id`** (string, required, indexed) - Game identifier (e.g., "sf6")
- **`character_id`** (string, required, indexed) - Character identifier
- **`patch_version`** (string, required, indexed) - Patch version (e.g., "1.05")
- **`is_current_patch`** (boolean, default: true, indexed) - Whether this is the current patch
- **`moveset`** (Moveset, required) - Organized moveset
- **`system_mechanics`** (SystemMechanic[], required) - System mechanics array
- **`legacy_movesets`** (LegacyMoveset[], optional) - Historical movesets for version tracking
- **`last_updated`** (Date, default: Date.now) - Last update timestamp
- **`created_at`** (Date, auto-generated) - Creation timestamp
- **`updated_at`** (Date, auto-generated) - Update timestamp

### Moveset Structure

The `moveset` field contains:

- **`normals`** (Move[]) - Normal moves
- **`specials`** (Move[]) - Special moves
- **`ex_moves`** (Move[]) - EX/Special Cancel/Overdrive moves
- **`supers`** (Move[]) - Super Arts

### Move Schema

Each move contains:

```typescript
{
  name: string;                    // Move name
  input: string;                   // e.g., "236P"
  how_to_perform: string;          // e.g., "Quarter Circle Forward + Punch"
  button_press?: string[];         // e.g., ["Down", "Down-Forward", "Forward", "Punch"]
  category: 'normal' | 'special' | 'ex' | 'super' | 'unique_action';
  properties?: string[];           // e.g., ["High", "Armor", "Projectile", "Cancelable"]
  frame_data: {                    // Frame data
    startup: number;               // Startup frames
    active: number;                // Active frames
    recovery: number;              // Recovery frames
    on_block: number;              // Frame advantage on block (negative means unsafe)
    on_hit?: number;               // Frame advantage on hit
    damage?: number;               // Damage value
  };
}
```

### System Mechanics Structure

The `system_mechanics` field is an array of system mechanic objects:

```typescript
{
  name: string;                    // e.g., "Burnout", "Drive Gauge", "Stun"
  description?: string;            // Description of the mechanic
  penalty_on_block?: number;       // e.g., SF6 Burnout adds +4 blockstun
  meter_cost?: number;             // Meter cost for the mechanic
}
```

### Legacy Movesets (Version/Patch Tracking)

The `legacy_movesets` field stores historical movesets:

```typescript
{
  patch_version: string;           // e.g., "1.04"
  moveset: Moveset;                // Moveset for that version
  system_mechanics: SystemMechanic[]; // System mechanics for that version
  patch_notes?: string;            // Patch notes
  last_updated?: Date;             // Last update date
}
```

## Example Usage

### Creating a Character Encyclopedia Entry

```typescript
import { CharacterEncyclopedia } from './models/CharacterEncyclopedia';

const ryuEncyclopedia = new CharacterEncyclopedia({
  game_id: 'sf6',
  character_id: 'ryu',
  patch_version: '1.05',
  is_current_patch: true,
  moveset: {
    normals: [
      {
        name: 'Standing Light Punch',
        input: '5LP',
        how_to_perform: 'Standing Light Punch',
        button_press: ['Punch'],
        category: 'normal',
        properties: ['Cancelable'],
        frame_data: {
          startup: 4,
          active: 3,
          recovery: 5,
          on_block: 3,
          on_hit: 6,
          damage: 400,
        },
      },
    ],
    specials: [
      {
        name: 'Hadoken',
        input: '236P',
        how_to_perform: 'Quarter Circle Forward + Punch',
        button_press: ['Down', 'Down-Forward', 'Forward', 'Punch'],
        category: 'special',
        properties: ['Projectile', 'Cancelable'],
        frame_data: {
          startup: 12,
          active: 3,
          recovery: 25,
          on_block: -5,
          on_hit: 2,
          damage: 800,
        },
      },
    ],
    ex_moves: [
      {
        name: 'EX Hadoken',
        input: '236PP',
        how_to_perform: 'Quarter Circle Forward + Two Punches',
        button_press: ['Down', 'Down-Forward', 'Forward', 'Punch', 'Punch'],
        category: 'ex',
        properties: ['Projectile', 'Cancelable', 'EX Move'],
        frame_data: {
          startup: 10,
          active: 3,
          recovery: 22,
          on_block: -3,
          on_hit: 4,
          damage: 1000,
        },
      },
    ],
    supers: [
      {
        name: 'Denjin Hadoken',
        input: '214214P',
        how_to_perform: 'Half Circle Forward (twice) + Punch',
        button_press: ['Back', 'Down-Back', 'Down', 'Down-Forward', 'Forward', 'Back', 'Down-Back', 'Down', 'Down-Forward', 'Forward', 'Punch'],
        category: 'super',
        properties: ['Projectile', 'Super Art'],
        frame_data: {
          startup: 5,
          active: 10,
          recovery: 45,
          on_block: -23,
          on_hit: 25,
          damage: 2400,
        },
      },
    ],
  },
  system_mechanics: [
    {
      name: 'Burnout',
      description: 'When Drive Gauge is empty, character enters Burnout state',
      penalty_on_block: 4, // Adds +4 blockstun
      meter_cost: 0,
    },
    {
      name: 'Drive Gauge',
      description: '6000 point gauge for Drive System moves',
      meter_cost: 1000, // Cost for Drive Rush
    },
    {
      name: 'Stun',
      description: 'Character can be stunned when stun gauge fills',
      penalty_on_block: 0,
      meter_cost: 0,
    },
  ],
  last_updated: new Date(),
});

await ryuEncyclopedia.save();
```

### Version/Patch Tracking Example

When updating a character for a new patch:

```typescript
// Get current encyclopedia entry
const currentEntry = await CharacterEncyclopedia.findOne({
  game_id: 'sf6',
  character_id: 'ryu',
  is_current_patch: true,
});

// Move current moveset to legacy
const legacyMoveset = {
  patch_version: currentEntry.patch_version,
  moveset: currentEntry.moveset,
  system_mechanics: currentEntry.system_mechanics,
  patch_notes: 'Hadoken recovery reduced by 2 frames',
  last_updated: currentEntry.last_updated,
};

// Update to new patch
currentEntry.is_current_patch = false;
currentEntry.legacy_movesets = [...(currentEntry.legacy_movesets || []), legacyMoveset];

// Create new entry for new patch
const newEntry = new CharacterEncyclopedia({
  game_id: 'sf6',
  character_id: 'ryu',
  patch_version: '1.06',
  is_current_patch: true,
  moveset: {
    // Updated moveset with new frame data
  },
  system_mechanics: [
    // Updated system mechanics
  ],
  legacy_movesets: [...currentEntry.legacy_movesets, legacyMoveset],
  last_updated: new Date(),
});

await currentEntry.save();
await newEntry.save();
```

## Indexes

The model includes indexes for:
- `game_id` + `character_id`
- `game_id` + `character_id` + `patch_version`
- `game_id` + `character_id` + `is_current_patch`
- `game_id` + `is_current_patch`
- Text search on: `character_id` and move names

## Move Categories

The `category` field accepts:
- **`normal`** - Normal moves (standing, crouching, jumping normals)
- **`special`** - Special moves
- **`ex`** - EX/Special Cancel/Overdrive moves
- **`super`** - Super Arts
- **`unique_action`** - Character-specific unique actions

## Properties

Common move properties include:
- **"High"** - High attack (can be blocked standing or crouching)
- **"Low"** - Low attack (must be blocked crouching)
- **"Mid"** - Mid attack (can be blocked standing or crouching)
- **"Overhead"** - Overhead attack (must be blocked standing)
- **"Armor"** - Armor property
- **"Projectile"** - Projectile attack
- **"Cancelable"** - Move can be cancelled
- **"EX Move"** - EX move indicator
- **"Super Art"** - Super Art indicator
- **"Invincible"** - Invincibility frames
- **"Armor Break"** - Breaks armor

## Frame Data Notes

- **`on_block`**: Negative values mean unsafe (opponent can punish), positive means safe
- **`on_hit`**: Positive values mean advantage (can continue pressure)
- **`startup`**: Frames before the move becomes active
- **`active`**: Frames the move is active
- **`recovery`**: Frames after the move is active before the character can act again

## Use Cases

1. **Character Guides**: Comprehensive character breakdowns with all moves organized by category
2. **Frame Data Reference**: Complete frame data lookup with input notation
3. **Training Mode Data**: Button press arrays for training mode practice
4. **Patch History**: Track how characters changed across patches with legacy movesets
5. **System Mechanics Reference**: Detailed system mechanics with penalties and costs
