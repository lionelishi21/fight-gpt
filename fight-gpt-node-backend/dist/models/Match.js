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
exports.Match = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const MatchCharacterSchema = new mongoose_1.Schema({
    character_id: { type: String, required: true },
    status: { type: String, enum: ['active', 'bench', 'dead'], required: true },
    position: { type: Number, required: true },
    assists: [{ type: String }]
}, { _id: false });
const MatchPlayerSchema = new mongoose_1.Schema({
    player_id: { type: String },
    name: { type: String, required: true },
    team: { type: [MatchCharacterSchema], required: true },
    score: { type: Number }
}, { _id: false });
const MatchEventSchema = new mongoose_1.Schema({
    timestamp: { type: String, required: true },
    event_type: {
        type: String,
        enum: [
            'neutral_win', 'punish', 'whiff_punish', 'anti_air', 'combo', 'drop',
            'blockstring', 'throw', 'tech', 'oki', 'burst',
            'assist_call', 'dhc', 'tag', 'happy_birthday', 'snapback', 'character_kill'
        ],
        required: true
    },
    actor: { type: String, enum: ['player1', 'player2'], required: true },
    description: { type: String, required: true },
    significance: { type: String, required: true },
    tags: [{ type: String }],
    active_character: { type: String },
    assist_character: { type: String },
    target_character: { type: String },
    target_assist: { type: String }
}, { _id: false });
const MatchSchema = new mongoose_1.Schema({
    match_id: { type: String, required: true, unique: true, index: true },
    game_id: { type: String, required: true, index: true },
    format: { type: String, enum: ['1v1', '2v2', '3v3'], required: true },
    player1: { type: MatchPlayerSchema, required: true },
    player2: { type: MatchPlayerSchema, required: true },
    winner: { type: String, enum: ['player1', 'player2', 'draw'] },
    events: { type: [MatchEventSchema], default: [] },
    video_url: { type: String },
    analysis_summary: { type: String }
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});
MatchSchema.index({ game_id: 1, 'player1.name': 1, 'player2.name': 1 });
MatchSchema.index({ created_at: -1 });
exports.Match = mongoose_1.default.model('Match', MatchSchema);
//# sourceMappingURL=Match.js.map