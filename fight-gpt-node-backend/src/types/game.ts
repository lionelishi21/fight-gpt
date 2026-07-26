/**
 * Game document interface
 */
export interface IGame {
  _id?: string;
  game_id: string; // Unique identifier (e.g., "sf6", "tk8", "ggst")
  startgg_id?: number; // Start.gg videogame ID (e.g., 43868 for SF6)
  name: string; // Display name (e.g., "Street Fighter 6")
  full_name?: string; // Full title (e.g., "Street Fighter 6")
  publisher?: string; // Game publisher
  developer?: string; // Game developer
  release_date?: Date; // Release date
  genre?: string; // Genre (e.g., "Fighting")
  platform?: string[]; // Platforms (e.g., ["PS5", "Xbox Series X", "PC"])
  icon_url?: string; // URL to game icon/logo
  banner_url?: string; // URL to game banner
  description?: string; // Game description
  is_active: boolean; // Whether the game is currently active/supported
  supported_characters_count?: number; // Number of characters (can be updated)
  latest_version?: string; // Latest patch version
  created_at?: Date;
  updated_at?: Date;
}

/**
 * Game creation request
 */
export interface CreateGameRequest {
  game_id: string;
  name: string;
  startgg_id?: number;
  full_name?: string;
  publisher?: string;
  developer?: string;
  release_date?: Date | string;
  genre?: string;
  platform?: string[];
  icon_url?: string;
  banner_url?: string;
  description?: string;
  is_active?: boolean;
  latest_version?: string;
}

/**
 * Game update request
 */
export interface UpdateGameRequest {
  game_id?: string;
  name?: string;
  startgg_id?: number;
  full_name?: string;
  publisher?: string;
  developer?: string;
  release_date?: Date | string;
  genre?: string;
  platform?: string[];
  icon_url?: string;
  banner_url?: string;
  description?: string;
  is_active?: boolean;
  supported_characters_count?: number;
  latest_version?: string;
}

/**
 * Game query filters
 */
export interface GameFilters {
  game_id?: string;
  name?: string;
  publisher?: string;
  developer?: string;
  genre?: string;
  platform?: string;
  is_active?: boolean;
}


