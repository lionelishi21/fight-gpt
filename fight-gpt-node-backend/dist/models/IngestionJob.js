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
exports.IngestionJob = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const IngestionJobSchema = new mongoose_1.Schema({
    job_id: { type: String, required: true, unique: true, index: true },
    game_id: { type: String, required: true, index: true },
    youtube_url: { type: String, required: true },
    video_title: { type: String },
    channel_name: { type: String },
    search_query: { type: String, required: true },
    source: { type: String, enum: ['scheduled', 'manual', 'tournament', 'pro_scout'], default: 'scheduled' },
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed', 'skipped'],
        default: 'pending',
        index: true,
    },
    error_message: { type: String },
    analysis_id: { type: String },
    scenario_count: { type: Number },
    retry_count: { type: Number, default: 0 },
    processed_at: { type: Date },
    pro_player_id: { type: String, index: true },
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    },
});
// Prevent duplicate ingestion of the same video
IngestionJobSchema.index({ youtube_url: 1 }, { unique: true });
IngestionJobSchema.index({ game_id: 1, status: 1 });
IngestionJobSchema.index({ game_id: 1, created_at: -1 });
exports.IngestionJob = mongoose_1.default.model('IngestionJob', IngestionJobSchema);
//# sourceMappingURL=IngestionJob.js.map