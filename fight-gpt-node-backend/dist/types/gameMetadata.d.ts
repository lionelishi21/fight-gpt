/**
 * Game Rule Interface
 * Modular mechanics system with key-value pairs and UI type
 */
export interface GameRule {
    key: string;
    value: unknown;
    ui_type: string;
    description?: string;
    metadata?: {
        [key: string]: unknown;
    };
}
/**
 * Game Metadata Interface
 * Stores game-specific constants and global mechanics
 */
export interface IGameMetadata {
    _id?: string;
    game_id: string;
    global_mechanics: GameRule[];
    constants: {
        team_size?: number;
        has_air_dash?: boolean;
        has_3d_movement?: boolean;
        has_assists?: boolean;
        has_dhc?: boolean;
        has_team_supers?: boolean;
        max_meter?: number;
        [key: string]: unknown;
    };
    patch_version?: string;
    is_current?: boolean;
    created_at?: Date;
    updated_at?: Date;
}
/**
 * Game Metadata Creation Request
 */
export interface CreateGameMetadataRequest {
    game_id: string;
    global_mechanics: GameRule[];
    constants: {
        team_size?: number;
        has_air_dash?: boolean;
        has_3d_movement?: boolean;
        has_assists?: boolean;
        has_dhc?: boolean;
        has_team_supers?: boolean;
        max_meter?: number;
        [key: string]: unknown;
    };
    patch_version?: string;
    is_current?: boolean;
}
/**
 * Game Metadata Update Request
 */
export interface UpdateGameMetadataRequest {
    global_mechanics?: GameRule[];
    constants?: {
        team_size?: number;
        has_air_dash?: boolean;
        has_3d_movement?: boolean;
        has_assists?: boolean;
        has_dhc?: boolean;
        has_team_supers?: boolean;
        max_meter?: number;
        [key: string]: unknown;
    };
    patch_version?: string;
    is_current?: boolean;
}
//# sourceMappingURL=gameMetadata.d.ts.map