import { GameRule } from './gameMetadata';
/**
 * Frame Data Interface
 */
export interface FrameData {
  startup: number;
  active: number;
  recovery: number;
  on_block: number; // Negative means unsafe
  on_hit?: number;
  damage?: number;
}

/**
 * Move Category
 */
export type MoveCategory = 'normal' | 'special' | 'ex' | 'super' | 'unique_action' | 'assist' | 'dhc' | 'team_super';



/**
 * Video Interface (for character guides and matches)
 */
export interface Video {
  title: string;
  youtube_id: string; // The v= parameter
  category: 'guide' | 'match' | 'combo';
  thumbnail?: string;
}

/**
 * Combo Interface
 */
export interface Combo {
  inputs: string[];
  damage: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  tags: string[];
  description?: string;
  video_url?: string;
  drive_gauge?: string;
  super_gauge?: string;
}

/**
 * Team-Based Move Interface (for assists, DHC, team supers)
 */
export interface TeamBasedMove {
  name: string;
  input: string; // e.g., "LP+LK+MP" for assist call
  how_to_perform: string;
  button_press?: string[];
  category: 'assist' | 'dhc' | 'team_super';
  team_member?: string; // Character ID for assist/DHC
  team_position?: number; // Position in team (1, 2, 3)
  frame_data: FrameData;
  properties?: string[];
  requirements?: {
    meter_cost?: number;
    assist_slot?: number; // Which assist slot (alpha, beta, gamma)
    dhc_order?: number; // Order in DHC chain
  };
}

/**
 * Move Interface
 */
export interface Move {
  name: string;
  input: string; // e.g., "236P"
  how_to_perform: string; // e.g., "Quarter Circle Forward + Punch"
  button_press?: string[]; // e.g., ["Down", "Down-Forward", "Forward", "Punch"]
  category: MoveCategory;
  properties?: string[]; // e.g., ["High", "Armor", "Projectile", "Cancelable"]
  frame_data: FrameData;
  video_url?: string; // demonstration video
  // Team-based move properties (for assists, DHC, team supers)
  team_member?: string;
  team_position?: number;
  requirements?: {
    meter_cost?: number;
    assist_slot?: number;
    dhc_order?: number;
  };
}

/**
 * Moveset Interface
 */
export interface Moveset {
  normals: Move[];
  specials: Move[];
  ex_moves: Move[];
  supers: Move[];
  assists?: TeamBasedMove[]; // Team-based assists
  dhc?: TeamBasedMove[]; // Delayed Hyper Combos
  team_supers?: TeamBasedMove[]; // Team supers
}

/**
 * Legacy Moveset Interface (for version/patch tracking)
 */
export interface LegacyMoveset {
  patch_version: string; // e.g., "1.04"
  moveset: Moveset;
  game_rules: GameRule[];
  patch_notes?: string;
  last_updated?: Date;
}

/**
 * Character Encyclopedia Interface
 */
export interface ICharacterEncyclopedia {
  _id?: string;
  game_id: string; // e.g., "sf6", "umvc3"
  character_id: string;
  patch_version: string; // e.g., "1.05"
  is_current_patch: boolean;
  moveset: Moveset;
  game_rules: GameRule[]; // Changed from system_mechanics
  videos?: Video[]; // Added videos
  combos?: Combo[]; // Added combos
  legacy_movesets?: LegacyMoveset[];
  last_updated: Date;
  created_at?: Date;
  updated_at?: Date;
}

/**
 * Character Encyclopedia Creation Request
 */
export interface CreateCharacterEncyclopediaRequest {
  game_id: string;
  character_id: string;
  patch_version: string;
  is_current_patch?: boolean;
  moveset: Moveset;
  game_rules: GameRule[];
  videos?: Video[];
  combos?: Combo[];
  legacy_movesets?: LegacyMoveset[];
  last_updated?: Date;
}

/**
 * Character Encyclopedia Update Request
 */
export interface UpdateCharacterEncyclopediaRequest {
  game_id?: string;
  character_id?: string;
  patch_version?: string;
  is_current_patch?: boolean;
  moveset?: Moveset;
  game_rules?: GameRule[];
  videos?: Video[];
  combos?: Combo[];
  legacy_movesets?: LegacyMoveset[];
  last_updated?: Date;
}
