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
exports.MetaReport = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const CharacterMetaStatSchema = new mongoose_1.Schema({
    character_id: { type: String, required: true },
    character_name: { type: String, required: true },
    usage_count: { type: Number, default: 0 },
    win_count: { type: Number, default: 0 },
    win_rate: { type: Number, default: 0 },
    trend: { type: String, enum: ['rising', 'falling', 'stable'], default: 'stable' },
    top_strategies: [{ type: String }],
}, { _id: false });
const MatchupInsightSchema = new mongoose_1.Schema({
    character_a: { type: String, required: true },
    character_b: { type: String, required: true },
    win_rate_a: { type: Number, required: true },
    dominant_strategy: { type: String, required: true },
    sample_size: { type: Number, default: 0 },
}, { _id: false });
const MetaReportSchema = new mongoose_1.Schema({
    report_id: { type: String, required: true, unique: true, index: true },
    game_id: { type: String, required: true, index: true },
    period: { type: String, enum: ['weekly', 'patch', 'monthly'], required: true },
    patch_version: { type: String },
    generated_at: { type: Date, required: true },
    status: { type: String, enum: ['generating', 'ready', 'error'], default: 'generating' },
    error_message: { type: String },
    tier_list: [CharacterMetaStatSchema],
    trending_characters: {
        rising: [{ type: String }],
        falling: [{ type: String }],
    },
    dominant_strategies: [{ type: String }],
    matchup_insights: [MatchupInsightSchema],
    meta_summary: { type: String, default: '' },
    patch_impact_summary: { type: String },
    source_scenario_count: { type: Number, default: 0 },
    source_video_count: { type: Number, default: 0 },
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    },
});
// Index for fetching latest report per game
MetaReportSchema.index({ game_id: 1, generated_at: -1 });
MetaReportSchema.index({ game_id: 1, period: 1, generated_at: -1 });
exports.MetaReport = mongoose_1.default.model('MetaReport', MetaReportSchema);
//# sourceMappingURL=MetaReport.js.map