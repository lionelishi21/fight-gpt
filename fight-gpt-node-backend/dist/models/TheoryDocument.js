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
exports.TheoryDoc = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const TheoryDocumentSchema = new mongoose_1.Schema({
    theory_id: { type: String, required: true, unique: true, index: true },
    game_id: { type: String, required: true, index: true },
    type: { type: String, enum: ['character', 'matchup', 'meta'], required: true },
    target_skill_level: { type: String, enum: ['Rookie', 'Intermediate', 'Pro'], default: 'Intermediate', index: true },
    character_id: { type: String, index: true },
    character_name: { type: String },
    character_a: { type: String },
    character_b: { type: String },
    title: { type: String, required: true },
    summary: { type: String, required: true },
    full_theory: { type: String, required: true },
    key_strengths: [{ type: String }],
    key_weaknesses: [{ type: String }],
    win_conditions: [{ type: String }],
    counterplay: [{ type: String }],
    source_scenario_count: { type: Number, default: 0 },
    confidence: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
    patch_version: { type: String, index: true },
    is_current_patch: { type: Boolean, default: true, index: true },
    vortex_graph: {
        nodes: [{
                id: String,
                label: String,
                description: String,
                type: { type: String, enum: ['neutral', 'pressure', 'finisher', 'reset'] }
            }],
        edges: [{
                source: String,
                target: String,
                label: String
            }]
    },
    generated_at: { type: Date, required: true },
    youtube_url: { type: String },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});
// Update indexes to include skill level
TheoryDocumentSchema.index({ game_id: 1, character_id: 1, target_skill_level: 1, is_current_patch: 1 });
TheoryDocumentSchema.index({ game_id: 1, character_a: 1, character_b: 1, target_skill_level: 1, is_current_patch: 1 });
TheoryDocumentSchema.index({ game_id: 1, type: 1, target_skill_level: 1, patch_version: 1 });
exports.TheoryDoc = mongoose_1.default.model('TheoryDocument', TheoryDocumentSchema);
//# sourceMappingURL=TheoryDocument.js.map