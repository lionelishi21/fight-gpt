# Game API Documentation

Complete CRUD API for managing fighting games. This is used for onboarding where users select which game they want to be coached for.

## Base URL

```
/api/games
```

## Endpoints

### 1. Create Game

**POST** `/api/games`

Create a new game entry.

**Request Body:**
```json
{
  "game_id": "sf6",
  "name": "Street Fighter 6",
  "full_name": "Street Fighter 6",
  "publisher": "Capcom",
  "developer": "Capcom",
  "release_date": "2023-06-02",
  "genre": "Fighting",
  "platform": ["PS5", "Xbox Series X", "PC"],
  "icon_url": "https://example.com/icons/sf6.png",
  "banner_url": "https://example.com/banners/sf6.jpg",
  "description": "The latest entry in the Street Fighter series",
  "is_active": true,
  "latest_version": "1.05"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "game_id": "sf6",
    "name": "Street Fighter 6",
    "full_name": "Street Fighter 6",
    "publisher": "Capcom",
    "developer": "Capcom",
    "release_date": "2023-06-02T00:00:00.000Z",
    "genre": "Fighting",
    "platform": ["PS5", "Xbox Series X", "PC"],
    "icon_url": "https://example.com/icons/sf6.png",
    "banner_url": "https://example.com/banners/sf6.jpg",
    "description": "The latest entry in the Street Fighter series",
    "is_active": true,
    "supported_characters_count": 0,
    "latest_version": "1.05",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  },
  "message": "Game created successfully"
}
```

---

### 2. Get Active Games (For Onboarding)

**GET** `/api/games/active`

Get all active games that users can select during onboarding. This is the **primary endpoint for onboarding**.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "game_id": "sf6",
      "name": "Street Fighter 6",
      "full_name": "Street Fighter 6",
      "icon_url": "https://example.com/icons/sf6.png",
      "is_active": true,
      "supported_characters_count": 20,
      "latest_version": "1.05"
    },
    {
      "_id": "...",
      "game_id": "tk8",
      "name": "Tekken 8",
      "full_name": "Tekken 8",
      "icon_url": "https://example.com/icons/tk8.png",
      "is_active": true,
      "supported_characters_count": 32,
      "latest_version": "1.03"
    }
  ]
}
```

---

### 3. Get Game by MongoDB ID

**GET** `/api/games/:id`

Get a specific game by MongoDB ObjectId.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "game_id": "sf6",
    "name": "Street Fighter 6",
    ...
  }
}
```

---

### 4. Get Game by game_id

**GET** `/api/games/game-id/:gameId`

Get a game by its game_id (e.g., "sf6", "tk8").

**Example:** `/api/games/game-id/sf6`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "game_id": "sf6",
    "name": "Street Fighter 6",
    ...
  }
}
```

---

### 5. Update Game by MongoDB ID

**PUT** `/api/games/:id`

Update an existing game. All fields are optional.

**Request Body:**
```json
{
  "name": "Street Fighter 6 - Updated",
  "latest_version": "1.06",
  "supported_characters_count": 22
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {...},
  "message": "Game updated successfully"
}
```

---

### 6. Update Game by game_id

**PUT** `/api/games/game-id/:gameId`

Update a game by its game_id.

**Example:** `/api/games/game-id/sf6`

**Request Body:**
```json
{
  "latest_version": "1.06",
  "is_active": true
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {...},
  "message": "Game updated successfully"
}
```

---

### 7. Delete Game

**DELETE** `/api/games/:id`

Delete a game. Will fail if the game has associated characters.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": true,
  "message": "Game deleted successfully"
}
```

**Error Response (if game has characters):**
```json
{
  "success": false,
  "error": "Cannot delete game. It has 20 character(s) associated with it."
}
```

---

### 8. Find Games (with filters)

**GET** `/api/games?gameId=sf6&name=Street&publisher=Capcom&isActive=true&limit=50`

Get games with optional filters.

**Query Parameters:**
- `gameId` (optional) - Filter by game ID
- `name` (optional) - Filter by name (partial match)
- `publisher` (optional) - Filter by publisher (partial match)
- `developer` (optional) - Filter by developer (partial match)
- `genre` (optional) - Filter by genre (partial match)
- `platform` (optional) - Filter by platform
- `isActive` (optional) - Filter by active status (true/false)
- `limit` (optional) - Limit results (1-1000, default: no limit)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "game_id": "sf6",
      "name": "Street Fighter 6",
      ...
    }
  ]
}
```

---

### 9. Search Games

**GET** `/api/games/search?q=street`

Search games by text query (searches name, full_name, description, and game_id).

**Query Parameters:**
- `q` (required) - Search query

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [...]
}
```

---

### 10. Activate Game

**PATCH** `/api/games/:id/activate`

Activate a game (set is_active to true).

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {...},
  "message": "Game activated successfully"
}
```

---

### 11. Deactivate Game

**PATCH** `/api/games/:id/deactivate`

Deactivate a game (set is_active to false).

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {...},
  "message": "Game deactivated successfully"
}
```

---

### 12. Refresh Character Count

**PATCH** `/api/games/game-id/:gameId/refresh-character-count`

Manually refresh the character count for a game by counting current characters.

**Example:** `/api/games/game-id/sf6/refresh-character-count`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {...},
  "message": "Character count refreshed to 20"
}
```

---

## Game ID Format

The `game_id` field must:
- Be lowercase
- Contain only letters (a-z), numbers (0-9), and underscores (_)
- Be unique across all games

Examples:
- ✅ `sf6` (Street Fighter 6)
- ✅ `tk8` (Tekken 8)
- ✅ `ggst` (Guilty Gear Strive)
- ✅ `mk1` (Mortal Kombat 1)
- ✅ `sf6_demo` (if needed)
- ❌ `SF6` (must be lowercase)
- ❌ `sf-6` (no hyphens, use underscores)

## Examples

### Create Street Fighter 6
```bash
curl -X POST http://localhost:3000/api/games \
  -H "Content-Type: application/json" \
  -d '{
    "game_id": "sf6",
    "name": "Street Fighter 6",
    "full_name": "Street Fighter 6",
    "publisher": "Capcom",
    "developer": "Capcom",
    "release_date": "2023-06-02",
    "genre": "Fighting",
    "platform": ["PS5", "Xbox Series X", "PC"],
    "icon_url": "https://example.com/icons/sf6.png",
    "is_active": true,
    "latest_version": "1.05"
  }'
```

### Get Active Games (For Onboarding)
```bash
curl http://localhost:3000/api/games/active
```

### Get Game by game_id
```bash
curl http://localhost:3000/api/games/game-id/sf6
```

### Search Games
```bash
curl "http://localhost:3000/api/games/search?q=street"
```

### Update Game
```bash
curl -X PUT http://localhost:3000/api/games/game-id/sf6 \
  -H "Content-Type: application/json" \
  -d '{
    "latest_version": "1.06",
    "is_active": true
  }'
```

## Automatic Character Count Updates

The character count (`supported_characters_count`) is automatically updated when:
- A character is created (increments count)
- A character is deleted (refreshes count)

You can also manually refresh the count using the `/api/games/game-id/:gameId/refresh-character-count` endpoint.

---

## Game Metadata Operations

Advanced features (like global game mechanics, constants, and AI prompt contexts) are handled by a dedicated `GameMetadata` API.

For detailed documentation, please see [GAME_METADATA_API.md](./docs/GAME_METADATA_API.md).



