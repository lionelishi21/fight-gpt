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
exports.OnboardingDocument = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const OnboardingDocumentSchema = new mongoose_1.Schema({
    artistProfileId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'ArtistProfile', required: true, index: true },
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    documentType: { type: String, required: true, index: true },
    originalFilename: { type: String, required: true },
    storageKey: { type: String, required: true, select: false },
    publicUrl: { type: String },
    mimeType: { type: String, required: true },
    fileSizeBytes: { type: Number, required: true },
    uploadedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['uploaded', 'under_review', 'accepted', 'rejected'], default: 'uploaded', index: true },
    rejectionReason: { type: String },
    reviewedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    expiresAt: { type: Date },
    checksum: { type: String, required: true },
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});
exports.OnboardingDocument = mongoose_1.default.model('OnboardingDocument', OnboardingDocumentSchema);
//# sourceMappingURL=OnboardingDocument.js.map