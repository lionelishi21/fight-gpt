# CharacterEncyclopedia API Documentation

The CharacterEncyclopedia API provides access to character-specific rules, strategies, and move lists. This data is critical for the AI service to contextualize a character's options, strengths, and weaknesses within a given game.

## Base URL
`/api`

## Endpoints

### 1. Create Character Encyclopedia
Create an encyclopedia entry for a specific character in a game.

**POST** `/games/:gameId/characters/:characterId/encyclopedia`

**Request Body:**
```json
{
  "version": "1.0.0",
  "is_current": true,
  "game_rules": [
    {
      "rule_name": "Denjin Charge",
      "description": "Ryu can charge his fireballs and Hashogeki."
    }
  ],
  "moves": {
    "normals": [
      {
        "name": "Standing Light Punch",
        "input": "LP",
        "startup": 4,
        "active": 3,
        "recovery": 11
      }
    ],
    "specials": [
       {
        "name": "Hadoken",
        "input": "236P"
       }
    ]
  },
  "strategy": {
    "strengths": ["Strong fireball game", "Good anti-airs"],
    "weaknesses": ["Linear approach"]
  }
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "60d5ecb8b392d700153a8a82",
    "game_id": "sf6",
    "character_id": "ryu",
    ...
  }
}
```

### 2. Get Current Character Encyclopedia (For AI)
Retrieve the currently active encyclopedia version for a specific character.

**GET** `/games/:gameId/characters/:characterId/encyclopedia/current`

**Response (200 OK):**
```json
{
  "success": true,
  "data": { ... }
}
```

### 3. Get Character Encyclopedia
Retrieve all encyclopedia versions for a specific character in a game.

**GET** `/games/:gameId/characters/:characterId/encyclopedia`

**Response (200 OK):**
```json
{
  "success": true,
  "data": [ { ... } ]
}
```

### 4. Get All Encyclopedias for a Game
Retrieve all active character encyclopedias for a specific game.

**GET** `/games/:gameId/encyclopedia`

**Response (200 OK):**
```json
{
  "success": true,
  "data": [ { ... }, { ... } ]
}
```

### 5. Get Game Rules (For AI)
Directly retrieve just the `game_rules` array for a specific character. This is optimized for the AI context builder.

**GET** `/games/:gameId/characters/:characterId/encyclopedia/rules`

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "rule_name": "Denjin Charge",
      "description": "Ryu can charge his fireballs and Hashogeki."
    }
  ]
}
```

### 6. Get Encyclopedia by ID
Retrieve a specific encyclopedia record by its MongoDB ID.

**GET** `/encyclopedia/:id`

**Response (200 OK):**
```json
{
  "success": true,
  "data": { ... }
}
```

### 7. Update Encyclopedia by Game & Character
Update the current encyclopedia for a specific character. (Updates where `is_current` is true).

**PUT** `/games/:gameId/characters/:characterId/encyclopedia`

**Request Body:** (Any fields from the Create request)

**Response (200 OK):**
```json
{
  "success": true,
  "data": { ... }
}
```

### 8. Update Encyclopedia by ID
Update a specific encyclopedia record by its MongoDB ID.

**PUT** `/encyclopedia/:id`

**Request Body:** (Any fields from the Create request)

**Response (200 OK):**
```json
{
  "success": true,
  "data": { ... }
}
```

### 9. Delete Encyclopedia
Delete an encyclopedia record by its MongoDB ID.

**DELETE** `/encyclopedia/:id`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Encyclopedia deleted successfully"
}
```
