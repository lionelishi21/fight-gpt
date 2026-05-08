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
exports.TrackSubmission = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const TrackSubmissionSchema = new mongoose_1.Schema({
    artistProfileId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'ArtistProfile', required: true, index: true },
    splitSheetId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'SplitSheet' },
    title: { type: String, required: true, index: true },
    featuredArtists: { type: [String], default: [] },
    genre: { type: String, required: true },
    subGenre: { type: String },
    releaseDate: { type: Date },
    audioFileKey: { type: String, required: true, select: false },
    audioFileMimeType: { type: String, required: true },
    durationSeconds: { type: Number },
    isrc: { type: String, index: true, sparse: true },
    upc: { type: String },
    contentRating: { type: String, enum: ['clean', 'explicit'], required: true },
    artworkUrl: { type: String },
    status: { type: String, enum: ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'live', 'removed'], default: 'draft', index: true },
    rejectionReason: { type: String },
    adminNotes: { type: String },
    reviewedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    submittedAt: { type: Date },
    approvedAt: { type: Date },
    liveAt: { type: Date },
    fingerprintStatus: { type: String, enum: ['not_run', 'pending', 'clear', 'match_found'], default: 'not_run' },
    fingerprintMatchDetails: { type: String },
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});
TrackSubmissionSchema.index({ artistProfileId: 1, status: 1 });
exports.TrackSubmission = mongoose_1.default.model('TrackSubmission', TrackSubmissionSchema);
//# sourceMappingURL=TrackSubmission.js.map