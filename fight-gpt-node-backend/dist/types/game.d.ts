/**
 * Game document interface
 */
export interface IGame {
    _id?: string;
    game_id: string;
    name: string;
    full_name?: string;
    publisher?: string;
    developer?: string;
    release_date?: Date;
    genre?: string;
    platform?: string[];
    icon_url?: string;
    banner_url?: string;
    description?: string;
    is_active: boolean;
    supported_characters_count?: number;
    latest_version?: string;
    created_at?: Date;
    updated_at?: Date;
}
/**
 * Game creation request
 */
export interface CreateGameRequest {
    game_id: string;
    name: string;
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
//# sourceMappingURL=game.d.ts.map