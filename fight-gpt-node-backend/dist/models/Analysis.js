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
exports.Analysis = void 0;
const mongoose_1 = __importStar(require("mongoose"));
/**
 * Analysis schema definition
 */
const AnalysisSchema = new mongoose_1.Schema({
    youtube_url: {
        type: String,
        index: true,
        sparse: true,
    },
    video_path: {
        type: String,
        index: true,
        sparse: true,
    },
    video_source: {
        type: String,
        enum: ['youtube', 'local_file'],
        required: true,
    },
    game_id: {
        type: String,
        index: true,
    },
    analysis: {
        type: mongoose_1.Schema.Types.Mixed,
        required: true,
    },
    analysis_id: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    user_id: {
        type: String,
        index: true,
        sparse: true,
    },
    p1_name: {
        type: String,
        index: true,
    },
    p2_name: {
        type: String,
        index: true,
    },
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    },
});
// Compound index for cache lookup
AnalysisSchema.index({ youtube_url: 1, video_source: 1 }, { sparse: true });
AnalysisSchema.index({ video_path: 1, video_source: 1 }, { sparse: true });
/**
 * Analysis model
 */
exports.Analysis = mongoose_1.default.model('Analysis', AnalysisSchema);
//# sourceMappingURL=Analysis.js.map