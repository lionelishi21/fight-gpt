import mongoose, { Document } from 'mongoose';
/**
 * Character Encyclopedia Document Interface
 */
export interface ICharacterEncyclopediaDocument extends Document {
    _id: mongoose.Types.ObjectId;
    game_id: string;
    character_id: string;
    patch_version: string;
    is_current_patch: boolean;
    moveset: {
        normals: MoveDocument[];
        specials: MoveDocument[];
        ex_moves: MoveDocument[];
        supers: MoveDocument[];
        assists?: MoveDocument[];
        dhc?: MoveDocument[];
        team_supers?: MoveDocument[];
    };
    game_rules: GameRuleDocument[];
    videos?: {
        title: string;
        youtube_id: string;
        category: 'guide' | 'match' | 'combo';
        thumbnail?: string;
    }[];
    combos?: {
        inputs: string[];
        damage: number;
        difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
        tags: string[];
        description?: string;
        video_url?: string;
        drive_gauge?: string;
        super_gauge?: string;
    }[];
    legacy_movesets?: LegacyMovesetDocument[];
    last_updated: Date;
    created_at?: Date;
    updated_at?: Date;
}
/**
 * Move Document Interface
 */
export interface MoveDocument {
    name: string;
    input: string;
    how_to_perform: string;
    button_press?: string[];
    category: 'normal' | 'special' | 'ex' | 'super' | 'unique_action' | 'assist' | 'dhc' | 'team_super';
    properties?: string[];
    frame_data: {
        startup: number;
        active: number;
        recovery: number;
        on_block: number;
        on_hit?: number;
        damage?: number;
    };
    team_member?: string;
    team_position?: number;
    requirements?: {
        meter_cost?: number;
        assist_slot?: number;
        dhc_order?: number;
    };
}
/**
 * Game Rule Document Interface
 */
export interface GameRuleDocument {
    key: string;
    value: unknown;
    ui_type: string;
    description?: string;
    metadata?: {
        [key: string]: unknown;
    };
}
/**
 * Legacy Moveset Document Interface
 */
export interface LegacyMovesetDocument {
    patch_version: string;
    moveset: {
        normals: MoveDocument[];
        specials: MoveDocument[];
        ex_moves: MoveDocument[];
        supers: MoveDocument[];
        assists?: MoveDocument[];
        dhc?: MoveDocument[];
        team_supers?: MoveDocument[];
    };
    game_rules: GameRuleDocument[];
    patch_notes?: string;
    last_updated?: Date;
}
/**
 * Character Encyclopedia Model
 */
export declare const CharacterEncyclopedia: mongoose.Model<ICharacterEncyclopediaDocument, {}, {}, {}, mongoose.Document<unknown, {}, ICharacterEncyclopediaDocument, {}, {}> & ICharacterEncyclopediaDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=CharacterEncyclopedia.d.ts.map