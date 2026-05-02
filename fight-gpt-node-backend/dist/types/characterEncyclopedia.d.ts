import { GameRule } from './gameMetadata';
/**
 * Frame Data Interface
 */
export interface FrameData {
    startup: number;
    active: number;
    recovery: number;
    on_block: number;
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
    youtube_id: string;
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
    input: string;
    how_to_perform: string;
    button_press?: string[];
    category: 'assist' | 'dhc' | 'team_super';
    team_member?: string;
    team_position?: number;
    frame_data: FrameData;
    properties?: string[];
    requirements?: {
        meter_cost?: number;
        assist_slot?: number;
        dhc_order?: number;
    };
}
/**
 * Move Interface
 */
export interface Move {
    name: string;
    input: string;
    how_to_perform: string;
    button_press?: string[];
    category: MoveCategory;
    properties?: string[];
    frame_data: FrameData;
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
    assists?: TeamBasedMove[];
    dhc?: TeamBasedMove[];
    team_supers?: TeamBasedMove[];
}
/**
 * Legacy Moveset Interface (for version/patch tracking)
 */
export interface LegacyMoveset {
    patch_version: string;
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
    game_id: string;
    character_id: string;
    patch_version: string;
    is_current_patch: boolean;
    moveset: Moveset;
    game_rules: GameRule[];
    videos?: Video[];
    combos?: Combo[];
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
//# sourceMappingURL=characterEncyclopedia.d.ts.map