# Character API Documentation

Complete CRUD API for managing fighting game characters, their moves, stats, and patch versions.

## Base URL

```
/api/characters
```

## Endpoints

### 1. Create Character

**POST** `/api/characters`

Create a new character with moves, stats, and patch information.

**Request Body:**
```json
{
  "game_id": "sf6",
  "name": "Ryu",
  "version": "1.05",
  "is_current": true,
  "stats": {
    "walk_speed": 4.5,
    "dash_frames": 18,
    "jump_speed": 5.2,
    "air_dash": false,
    "backdash_frames": 20,
    "throw_range": 1.2
  },
  "moves": [
    {
      "id": "h_hadoken",
      "name": "Heavy Hadoken",
      "startup": 12,
      "active": 3,
      "recovery": 25,
      "on_block": -5,
      "on_hit": 2,
      "on_counter_hit": 5,
      "damage": 800,
      "stun": 100,
      "tags": ["projectile", "special"],
      "notes": "Projectile that travels full screen"
    }
  ],
  "patch_notes_summary": "Walk speed increased by 5%, Hadoken recovery reduced by 2 frames."
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "game_id": "sf6",
    "name": "Ryu",
    "version": "1.05",
    "is_current": true,
    "stats": {...},
    "moves": [...],
    "patch_notes_summary": "...",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  },
  "message": "Character created successfully"
}
```

---

### 2. Get Character by ID

**GET** `/api/characters/:id`

Get a specific character by MongoDB ObjectId.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "game_id": "sf6",
    "name": "Ryu",
    ...
  }
}
```

---

### 3. Update Character

**PUT** `/api/characters/:id`

Update an existing character. All fields are optional.

**Request Body:**
```json
{
  "version": "1.06",
  "is_current": true,
  "stats": {
    "walk_speed": 4.6
  },
  "patch_notes_summary": "Walk speed increased by 0.1"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {...},
  "message": "Character updated successfully"
}
```

---

### 4. Delete Character

**DELETE** `/api/characters/:id`

Delete a character by ID.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": true,
  "message": "Character deleted successfully"
}
```

---

### 5. Find Characters (with filters)

**GET** `/api/characters?gameId=sf6&name=Ryu&version=1.05&isCurrent=true&limit=50`

Get characters with optional filters.

**Query Parameters:**
- `gameId` (optional) - Filter by game ID
- `name` (optional) - Filter by character name
- `version` (optional) - Filter by version
- `isCurrent` (optional) - Filter by current status (true/false)
- `limit` (optional) - Limit results (1-1000, default: no limit)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "game_id": "sf6",
      "name": "Ryu",
      ...
    }
  ]
}
```

---

### 6. Search Characters

**GET** `/api/characters/search?q=ryu&gameId=sf6`

Search characters by text query (searches name and patch notes).

**Query Parameters:**
- `q` (required) - Search query
- `gameId` (optional) - Filter by game ID

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [...]
}
```

---

### 7. Get All Characters by Game

**GET** `/api/characters/game/:gameId`

Get all characters (all versions) for a specific game.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [...]
}
```

---

### 8. Get Current Characters by Game

**GET** `/api/characters/game/:gameId/current`

Get only current version characters for a specific game.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [...]
}
```

---

### 9. Get Characters by Game and Name

**GET** `/api/characters/game/:gameId/name/:name`

Get all versions of a specific character for a game.

**Example:** `/api/characters/game/sf6/name/Ryu`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [...]
}
```

---

### 10. Get Current Character by Game and Name

**GET** `/api/characters/game/:gameId/name/:name/current`

Get the current version of a specific character.

**Example:** `/api/characters/game/sf6/name/Ryu/current`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {...}
}
```

---

### 11. Get Characters by Game and Version

**GET** `/api/characters/game/:gameId/version/:version`

Get all characters for a specific game version.

**Example:** `/api/characters/game/sf6/version/1.05`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [...]
}
```

---

### 12. Set Character as Current

**PATCH** `/api/characters/:id/current`

Set or unset a character as the current version. This will automatically unset other characters with the same game_id and name.

**Request Body:**
```json
{
  "isCurrent": true
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {...},
  "message": "Character set as current successfully"
}
```

---

## Move Tags

Valid move tags:
- `projectile`
- `special`
- `normal`
- `command_normal`
- `super`
- `overdrive`
- `throw`
- `anti_air`
- `low`
- `overhead`
- `meaty`
- `whiff_punish`

## Character Stats

Common stats (all optional):
- `walk_speed` (number)
- `dash_frames` (number)
- `jump_speed` (number)
- `air_dash` (boolean)
- `backdash_frames` (number)
- `throw_range` (number)

Additional stats can be added as needed.

## Move Properties

Required:
- `id` (string) - Unique move identifier
- `name` (string) - Move name
- `startup` (number) - Startup frames
- `active` (number) - Active frames
- `recovery` (number) - Recovery frames
- `on_block` (number) - Frame advantage on block
- `tags` (array of strings) - Move tags

Optional:
- `on_hit` (number) - Frame advantage on hit
- `on_counter_hit` (number) - Frame advantage on counter hit
- `damage` (number) - Move damage
- `stun` (number) - Stun value
- `notes` (string) - Additional notes

## Examples

### Create Ryu (Street Fighter 6)
```bash
curl -X POST http://localhost:3000/api/characters \
  -H "Content-Type: application/json" \
  -d '{
    "game_id": "sf6",
    "name": "Ryu",
    "version": "1.05",
    "is_current": true,
    "stats": {
      "walk_speed": 4.5,
      "dash_frames": 18
    },
    "moves": [
      {
        "id": "h_hadoken",
        "name": "Heavy Hadoken",
        "startup": 12,
        "active": 3,
        "recovery": 25,
        "on_block": -5,
        "tags": ["projectile", "special"]
      }
    ],
    "patch_notes_summary": "Walk speed increased by 5%"
  }'
```

### Get Current Ryu
```bash
curl http://localhost:3000/api/characters/game/sf6/name/Ryu/current
```

### Search Characters
```bash
curl "http://localhost:3000/api/characters/search?q=hadoken&gameId=sf6"
```

### Update Character
```bash
curl -X PUT http://localhost:3000/api/characters/{id} \
  -H "Content-Type: application/json" \
  -d '{
    "version": "1.06",
    "is_current": true,
    "patch_notes_summary": "Updated to version 1.06"
  }'
```

