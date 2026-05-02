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
exports.Character = void 0;
const mongoose_1 = __importStar(require("mongoose"));
/**
 * Character move schema
 */
const CharacterMoveSchema = new mongoose_1.Schema({
    id: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
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
    on_counter_hit: {
        type: Number,
    },
    damage: {
        type: Number,
    },
    stun: {
        type: Number,
    },
    tags: {
        type: [String],
        required: true,
        enum: [
            'projectile',
            'special',
            'normal',
            'command_normal',
            'super',
            'overdrive',
            'throw',
            'anti_air',
            'low',
            'overhead',
            'meaty',
            'whiff_punish',
        ],
    },
    notes: {
        type: String,
    },
}, {
    _id: false, // Don't create _id for subdocuments
});
/**
 * Character stats schema
 */
const CharacterStatsSchema = new mongoose_1.Schema({
    walk_speed: {
        type: Number,
    },
    dash_frames: {
        type: Number,
    },
    jump_speed: {
        type: Number,
    },
    air_dash: {
        type: Boolean,
    },
    backdash_frames: {
        type: Number,
    },
    throw_range: {
        type: Number,
    },
}, {
    _id: false,
    strict: false, // Allow additional properties
});
/**
 * Character schema definition
 */
const CharacterSchema = new mongoose_1.Schema({
    game_id: {
        type: String,
        required: true,
        index: true,
    },
    name: {
        type: String,
        required: true,
        index: true,
    },
    version: {
        type: String,
        required: true,
        index: true,
    },
    is_current: {
        type: Boolean,
        required: true,
        default: false,
        index: true,
    },
    archetype: {
        type: String,
        index: true,
    },
    difficulty: {
        type: Number,
        min: 1,
        max: 3,
    },
    description: {
        type: String,
    },
    stats: {
        type: CharacterStatsSchema,
        required: true,
    },
    moves: {
        type: [CharacterMoveSchema],
        required: true,
        default: [],
    },
    patch_notes_summary: {
        type: String,
    },
    status: {
        type: String,
        enum: ['released', 'coming_soon'],
        default: 'released',
        required: true,
        index: true,
    },
    // Lowercase name variations used for text extraction from AI-generated scenarios.
    // e.g. Chun-Li: ['chun-li', 'chunli', 'chun_li']
    // e.g. M.Bison: ['m_bison', 'bison', 'm.bison']
    aliases: {
        type: [String],
        default: [],
        index: true,
    },
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    },
});
// Compound indexes for common queries
CharacterSchema.index({ game_id: 1, name: 1 });
CharacterSchema.index({ game_id: 1, version: 1 });
CharacterSchema.index({ game_id: 1, is_current: 1 });
CharacterSchema.index({ game_id: 1, name: 1, is_current: 1 });
// Text index for search
CharacterSchema.index({ name: 'text', patch_notes_summary: 'text' });
/**
 * Character model
 */
exports.Character = mongoose_1.default.model('Character', CharacterSchema);
//# sourceMappingURL=Character.js.map