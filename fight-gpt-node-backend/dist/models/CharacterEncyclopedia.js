"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CharacterEncyclopedia = void 0;
const mongoose_1 = __importStar(require("mongoose"));
/**
 * Frame Data Schema
 */
const FrameDataSchema = new mongoose_1.Schema({
    startup: {
        type: Number,
        required: true,
    },
    active: {
        type: Number,
        required: true,
    },
    recovery: {
        type: Number,
        required: true,
    },
    on_block: {
        type: Number,
        required: true,
    },
    on_hit: {
        type: Number,
    },
    damage: {
        type: Number,
    },
}, {
    _id: false,
});
/**
 * Move Requirements Schema (for team-based moves)
 */
const MoveRequirementsSchema = new mongoose_1.Schema({
    meter_cost: {
        type: Number,
    },
    assist_slot: {
        type: Number,
    },
    dhc_order: {
        type: Number,
    },
}, {
    _id: false,
});
/**
 * Move Schema
 */
const MoveSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    input: {
        type: String,
        required: true,
        trim: true,
    },
    how_to_perform: {
        type: String,
        required: true,
        trim: true,
    },
    button_press: {
        type: [String],
        default: [],
    },
    category: {
        type: String,
        enum: ['normal', 'special', 'ex', 'super', 'unique_action', 'assist', 'dhc', 'team_super'],
        required: true,
    },
    properties: {
        type: [String],
        default: [],
    },
    frame_data: {
        type: FrameDataSchema,
        required: true,
    },
    // Team-based move properties
    team_member: {
        type: String,
        trim: true,
    },
    team_position: {
        type: Number,
    },
    requirements: {
        type: MoveRequirementsSchema,
    },
}, {
    _id: false,
});
/**
 * Game Rule Schema
 */
const GameRuleSchema = new mongoose_1.Schema({
    key: {
        type: String,
        required: true,
        trim: true,
    },
    value: {
        type: mongoose_1.Schema.Types.Mixed,
        required: true,
    },
    ui_type: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    metadata: {
        type: mongoose_1.Schema.Types.Mixed,
        default: {},
    },
}, {
    _id: false,
});
/**
 * Video Schema
 */
const VideoSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    youtube_id: {
        type: String,
        required: true,
        trim: true,
    },
    category: {
        type: String,
        enum: ['guide', 'match', 'combo'],
        required: true,
    },
    thumbnail: {
        type: String,
        trim: true,
    },
}, {
    _id: false,
});
/**
 * Combo Schema
 */
const ComboSchema = new mongoose_1.Schema({
    inputs: {
        type: [String],
        required: true,
    },
    damage: {
        type: Number,
        required: true,
    },
    difficulty: {
        type: String,
        enum: ['Beginner', 'Intermediate', 'Advanced'],
        required: true,
    },
    tags: {
        type: [String],
        default: [],
    },
    description: {
        type: String,
        trim: true,
    },
    video_url: {
        type: String,
        trim: true,
    },
    drive_gauge: {
        type: String,
        trim: true,
    },
    super_gauge: {
        type: String,
        trim: true,
    },
}, {
    _id: false,
});
/**
 * Moveset Schema
 */
const MovesetSchema = new mongoose_1.Schema({
    normals: {
        type: [MoveSchema],
        default: [],
    },
    specials: {
        type: [MoveSchema],
        default: [],
    },
    ex_moves: {
        type: [MoveSchema],
        default: [],
    },
    supers: {
        type: [MoveSchema],
        default: [],
    },
    // Team-based moves
    assists: {
        type: [MoveSchema],
        default: [],
    },
    dhc: {
        type: [MoveSchema],
        default: [],
    },
    team_supers: {
        type: [MoveSchema],
        default: [],
    },
}, {
    _id: false,
});
/**
 * Legacy Moveset Schema (for version/patch tracking)
 */
const LegacyMovesetSchema = new mongoose_1.Schema({
    patch_version: {
        type: String,
        required: true,
        trim: true,
    },
    moveset: {
        type: MovesetSchema,
        required: true,
    },
    game_rules: {
        type: [GameRuleSchema],
        default: [],
    },
    patch_notes: {
        type: String,
        trim: true,
    },
    last_updated: {
        type: Date,
    },
}, {
    _id: false,
});
/**
 * Character Encyclopedia Schema
 */
const CharacterEncyclopediaSchema = new mongoose_1.Schema({
    game_id: {
        type: String,
        required: true,
        index: true,
        trim: true,
    },
    character_id: {
        type: String,
        required: true,
        index: true,
        trim: true,
    },
    patch_version: {
        type: String,
        required: true,
        index: true,
        trim: true,
    },
    is_current_patch: {
        type: Boolean,
        default: true,
        index: true,
    },
    moveset: {
        type: MovesetSchema,
        required: true,
    },
    game_rules: {
        type: [GameRuleSchema],
        default: [],
    },
    videos: {
        type: [VideoSchema],
        default: [],
    },
    combos: {
        type: [ComboSchema],
        default: [],
    },
    legacy_movesets: {
        type: [LegacyMovesetSchema],
        default: [],
    },
    last_updated: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    },
});
// Compound indexes for common queries
CharacterEncyclopediaSchema.index({ game_id: 1, character_id: 1 });
CharacterEncyclopediaSchema.index({ game_id: 1, character_id: 1, patch_version: 1 });
CharacterEncyclopediaSchema.index({ game_id: 1, character_id: 1, is_current_patch: 1 });
CharacterEncyclopediaSchema.index({ game_id: 1, is_current_patch: 1 });
// Text index for search
CharacterEncyclopediaSchema.index({
    character_id: 'text',
    'moveset.normals.name': 'text',
    'moveset.specials.name': 'text',
    'moveset.ex_moves.name': 'text',
    'moveset.supers.name': 'text',
    'moveset.assists.name': 'text',
    'moveset.dhc.name': 'text',
    'moveset.team_supers.name': 'text',
});
/**
 * Character Encyclopedia Model
 */
exports.CharacterEncyclopedia = mongoose_1.default.model('CharacterEncyclopedia', CharacterEncyclopediaSchema);
//# sourceMappingURL=CharacterEncyclopedia.js.map