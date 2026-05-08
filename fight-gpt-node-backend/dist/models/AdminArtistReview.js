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
exports.AdminArtistReview = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const ReviewChecklistItem = new mongoose_1.Schema({
    item: { type: String, required: true },
    passed: { type: Boolean },
    notes: { type: String },
    checkedAt: { type: Date },
}, { _id: false });
const ReviewComment = new mongoose_1.Schema({
    authorId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    isInternal: { type: Boolean, default: true },
}, { _id: true });
const DEFAULT_CHECKLIST = [
    'Identity verified (government ID uploaded and authentic)',
    'Legal name matches government ID',
    'Date of birth confirms 18+ years of age',
    'Tax form submitted (correct type for jurisdiction)',
    'Tax ID format valid',
    'TOS signed with server-recorded timestamp',
    'Distribution Agreement signed with timestamp',
    'Content Policy acknowledged',
    'Payout method configured',
    'Bank verification complete (if ACH selected)',
    'No OFAC/sanctions list match',
    'No duplicate account detected',
    'Split sheet percentages sum to 100% (if applicable)',
    'Cover song mechanical license documented (if applicable)',
    'Sample clearance documented (if applicable)',
];
const AdminArtistReviewSchema = new mongoose_1.Schema({
    artistProfileId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'ArtistProfile', required: true, index: true },
    reviewType: { type: String, enum: ['initial_approval', 'document_review', 'kyc_review', 'track_review', 'periodic_review'], required: true },
    assignedTo: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', index: true },
    status: { type: String, enum: ['queued', 'in_progress', 'approved', 'rejected', 'more_info_requested'], default: 'queued', index: true },
    priority: { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal', index: true },
    checklist: {
        type: [ReviewChecklistItem],
        default: () => DEFAULT_CHECKLIST.map(item => ({ item, passed: undefined })),
    },
    comments: { type: [ReviewComment], default: [] },
    outcome: { type: String, enum: ['approved', 'rejected', 'more_info_requested'] },
    outcomeNotes: { type: String },
    outcomeAt: { type: Date },
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});
AdminArtistReviewSchema.index({ status: 1, priority: -1, created_at: 1 });
exports.AdminArtistReview = mongoose_1.default.model('AdminArtistReview', AdminArtistReviewSchema);
//# sourceMappingURL=AdminArtistReview.js.map