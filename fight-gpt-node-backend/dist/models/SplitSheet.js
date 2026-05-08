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
exports.SplitSheet = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const EmbeddedSplitPartySchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    email: { type: String },
    role: { type: String, enum: ['composer', 'lyricist', 'producer', 'performer', 'publisher', 'co_writer'], required: true },
    ipiNumber: { type: String },
    proAffiliation: { type: String },
    masterSplit: { type: Number, required: true, min: 0, max: 100 },
    publishingSplit: { type: Number, required: true, min: 0, max: 100 },
    acceptedAt: { type: Date },
}, { _id: false });
const SplitSheetSchema = new mongoose_1.Schema({
    artistProfileId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'ArtistProfile', required: true, index: true },
    trackTitle: { type: String, required: true },
    isrc: { type: String, index: true, sparse: true },
    trackSubmissionId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'TrackSubmission' },
    status: { type: String, enum: ['draft', 'pending_signatures', 'fully_executed', 'disputed'], default: 'draft', index: true },
    parties: { type: [EmbeddedSplitPartySchema], required: true },
    totalMasterSplit: { type: Number, default: 100 },
    totalPublishingSplit: { type: Number, default: 100 },
    mechanicalLicenseRequired: { type: Boolean, default: false },
    mechanicalLicenseStatus: { type: String, enum: ['not_required', 'pending', 'obtained', 'compulsory'] },
    samplesUsed: { type: Boolean, default: false },
    sampleClearanceStatus: { type: String, enum: ['cleared', 'pending', 'not_required'] },
    coverSong: { type: Boolean, default: false },
    originalSongTitle: { type: String },
    originalArtist: { type: String },
    copyrightRegistrationNumber: { type: String },
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});
exports.SplitSheet = mongoose_1.default.model('SplitSheet', SplitSheetSchema);
//# sourceMappingURL=SplitSheet.js.map