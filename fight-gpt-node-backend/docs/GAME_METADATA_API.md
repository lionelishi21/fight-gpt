# GameMetadata API Documentation

The GameMetadata API provides access to global configuration, mechanics, and constants for specific fighting games. This data is used by the AI analysis service to understand the rules and constraints of the game being analyzed.

## Base URL
`/api`

## Endpoints

### 1. Create Game Metadata
Create new metadata for a fighting game.

**POST** `/games/:gameId/metadata`

**Request Body:**
```json
{
  "name": "Street Fighter 6",
  "version": "1.0.0",
  "is_current": true,
  "global_mechanics": [
    {
      "mechanic_name": "Drive System",
      "description": "A universal resource gauge used for offensive and defensive techniques."
    }
  ],
  "constants": {
    "team_size": 1,
    "has_3d_movement": false,
    "meter_bars": 3
  }
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "60d5ecb8b392d700153a8a81",
    "game_id": "sf6",
    ...
  }
}
```

### 2. Get Current Game Metadata (For AI)
Retrieve the currently active metadata version for a specific game. This is the primary endpoint used by the AI service.

**GET** `/games/:gameId/metadata/current`

**Response (200 OK):**
```json
{
  "success": true,
  "data": { ... }
}
```

### 3. Get Game Metadata by Game ID
Retrieve all metadata versions for a specific game.

**GET** `/games/:gameId/metadata`

**Response (200 OK):**
```json
{
  "success": true,
  "data": [ { ... }, { ... } ]
}
```

### 4. Get Metadata by ID
Retrieve a specific metadata record by its MongoDB ID.

**GET** `/metadata/:id`

**Response (200 OK):**
```json
{
  "success": true,
  "data": { ... }
}
```

### 5. Update Metadata by ID
Update an existing metadata record using its MongoDB ID.

**PUT** `/metadata/:id`

**Request Body:** (Any fields from the Create request)

**Response (200 OK):**
```json
{
  "success": true,
  "data": { ... }
}
```

### 6. Update Metadata by Game ID
Update the current metadata for a specific game. (Note: This updates the metadata where `is_current` is true).

**PUT** `/games/:gameId/metadata`

**Request Body:** (Any fields from the Create request)

**Response (200 OK):**
```json
{
  "success": true,
  "data": { ... }
}
```

### 7. Delete Metadata
Delete a metadata record by its MongoDB ID.

**DELETE** `/metadata/:id`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Metadata deleted successfully"
}
```
