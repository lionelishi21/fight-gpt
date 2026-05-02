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
exports.Game = void 0;
const mongoose_1 = __importStar(require("mongoose"));
/**
 * Game schema definition
 */
const GameSchema = new mongoose_1.Schema({
    game_id: {
        type: String,
        required: true,
        unique: true,
        index: true,
        lowercase: true, // Store as lowercase for consistency
        trim: true,
    },
    name: {
        type: String,
        required: true,
        index: true,
        trim: true,
    },
    full_name: {
        type: String,
        trim: true,
    },
    publisher: {
        type: String,
        index: true,
        trim: true,
    },
    developer: {
        type: String,
        index: true,
        trim: true,
    },
    release_date: {
        type: Date,
    },
    genre: {
        type: String,
        index: true,
        default: 'Fighting',
        trim: true,
    },
    match_format: {
        type: String,
        enum: ['1v1', 'team_3v3', 'team_2v2', 'team_tag'],
        default: '1v1',
        required: true,
        index: true,
    },
    platform: {
        type: [String],
        default: [],
    },
    icon_url: {
        type: String,
        trim: true,
    },
    banner_url: {
        type: String,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    is_active: {
        type: Boolean,
        required: true,
        default: true,
        index: true,
    },
    supported_characters_count: {
        type: Number,
        default: 0,
    },
    latest_version: {
        type: String,
        trim: true,
    },
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    },
});
// Compound indexes for common queries
GameSchema.index({ is_active: 1, name: 1 });
GameSchema.index({ publisher: 1, is_active: 1 });
GameSchema.index({ developer: 1, is_active: 1 });
// Text index for search
GameSchema.index({ name: 'text', full_name: 'text', description: 'text' });
// Ensure game_id is unique and lowercase
GameSchema.pre('save', function (next) {
    if (this.isModified('game_id')) {
        this.game_id = this.game_id.toLowerCase().trim();
    }
    next();
});
/**
 * Game model
 */
exports.Game = mongoose_1.default.model('Game', GameSchema);
//# sourceMappingURL=Game.js.map