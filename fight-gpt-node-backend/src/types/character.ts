/**
 * Character statistics
 */
export interface CharacterStats {
  walk_speed?: number;
  dash_frames?: number;
  jump_speed?: number;
  air_dash?: boolean;
  backdash_frames?: number;
  throw_range?: number;
  [key: string]: unknown; // Allow additional stats
}

/**
 * Character move tags
 */
export type MoveTag = 'projectile' | 'special' | 'normal' | 'command_normal' | 'super' | 'overdrive' | 'throw' | 'anti_air' | 'low' | 'overhead' | 'meaty' | 'whiff_punish';

/**
 * Character move
 */
export interface CharacterMove {
  id: string;
  name: string;
  startup: number;
  active: number;
  recovery: number;
  on_block: number;
  on_hit?: number;
  on_counter_hit?: number;
  damage?: number;
  stun?: number;
  tags: MoveTag[];
  notes?: string;
  [key: string]: unknown; // Allow additional properties
}

/**
 * Character document interface
 */
export interface ICharacter {
  _id?: string;
  game_id: string;
  name: string;
  version: string;
  is_current: boolean;
  archetype?: string;
  difficulty?: number;
  description?: string;
  stats: CharacterStats;
  moves: CharacterMove[];
  patch_notes_summary?: string;
  status?: 'released' | 'coming_soon';
  created_at?: Date;
  updated_at?: Date;
}

/**
 * Character creation request
 */
export interface CreateCharacterRequest {
  game_id: string;
  name: string;
  version: string;
  is_current: boolean;
  archetype?: string;
  difficulty?: number;
  description?: string;
  stats: CharacterStats;
  moves: CharacterMove[];
  patch_notes_summary?: string;
  status?: 'released' | 'coming_soon';
}

/**
 * Character update request
 */
export interface UpdateCharacterRequest {
  game_id?: string;
  name?: string;
  version?: string;
  is_current?: boolean;
  archetype?: string;
  difficulty?: number;
  description?: string;
  stats?: CharacterStats;
  moves?: CharacterMove[];
  patch_notes_summary?: string;
  status?: 'released' | 'coming_soon';
}

/**
 * Character query filters
 */
export interface CharacterFilters {
  game_id?: string;
  name?: string;
  version?: string;
  is_current?: boolean;
}

