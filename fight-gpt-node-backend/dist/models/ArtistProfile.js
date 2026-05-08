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
exports.ArtistProfile = exports.SplitPartySchema = void 0;
const mongoose_1 = __importStar(require("mongoose"));
exports.SplitPartySchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    email: { type: String },
    role: { type: String, enum: ['composer', 'lyricist', 'producer', 'performer', 'publisher', 'co_writer'], required: true },
    ipiNumber: { type: String },
    proAffiliation: { type: String },
    masterSplit: { type: Number, required: true, min: 0, max: 100 },
    publishingSplit: { type: Number, required: true, min: 0, max: 100 },
    acceptedAt: { type: Date },
}, { _id: false });
const BankAccountSchema = new mongoose_1.Schema({
    bankName: { type: String, required: true },
    accountHolderName: { type: String, required: true },
    accountType: { type: String, enum: ['checking', 'savings', 'business'], required: true },
    routingNumber: { type: String },
    accountNumberLast4: { type: String },
    swiftCode: { type: String },
    ibanLast4: { type: String },
    bankCountry: { type: String, required: true },
    currency: { type: String, required: true },
    verificationStatus: { type: String, enum: ['unverified', 'micro_deposit_pending', 'verified', 'failed'], default: 'unverified' },
    verifiedAt: { type: Date },
}, { _id: false });
const ArtistProfileSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    onboardingStatus: { type: String, enum: ['draft', 'pending_review', 'under_review', 'approved', 'rejected', 'suspended'], default: 'draft', index: true },
    onboardingStep: { type: Number, default: 1, min: 1, max: 8 },
    submittedAt: { type: Date },
    approvedAt: { type: Date },
    approvedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    rejectedAt: { type: Date },
    rejectedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    rejectionReason: { type: String },
    // Step 1
    artistType: { type: String, enum: ['solo_artist', 'band', 'producer', 'dj', 'songwriter', 'record_label', 'collective'], index: true },
    stageName: { type: String, index: true },
    legalName: { type: String, index: true },
    country: { type: String, index: true },
    dateOfBirth: { type: Date },
    entityType: { type: String, enum: ['individual', 'sole_proprietor', 'llc', 'corporation', 'partnership'] },
    // Step 2
    bio: { type: String, maxlength: 2000 },
    genres: { type: [String], default: [] },
    subGenres: { type: [String], default: [] },
    profileImageUrl: { type: String },
    bannerImageUrl: { type: String },
    socialLinks: { type: mongoose_1.Schema.Types.Mixed, default: {} },
    // Step 3
    isni: { type: String },
    ipiCaeNumber: { type: String },
    proAffiliation: { type: String },
    proMembershipNumber: { type: String },
    hasPublisher: { type: Boolean, default: false },
    publisherName: { type: String },
    publisherIPI: { type: String },
    // Step 4
    masterOwnership: { type: String, enum: ['full', 'partial', 'label_owned'] },
    publishingOwnership: { type: String, enum: ['full', 'partial', 'co_published', 'label_owned'] },
    distributionType: { type: String, enum: ['exclusive', 'non_exclusive'] },
    distributionTerritories: { type: [String], default: ['worldwide'] },
    hasExistingDistribution: { type: Boolean, default: false },
    existingDistributors: { type: [String], default: [] },
    contentRating: { type: String, enum: ['clean', 'explicit', 'mixed'] },
    agreedToTOS: { type: Boolean, default: false, index: true },
    tosAgreedAt: { type: Date },
    tosVersion: { type: String },
    tosAgreedIp: { type: String },
    agreedToDistributionAgreement: { type: Boolean, default: false },
    distributionAgreementSignedAt: { type: Date },
    agreedToContentPolicy: { type: Boolean, default: false },
    contentPolicyAgreedAt: { type: Date },
    // Step 5
    taxCountry: { type: String },
    taxFormType: { type: String, enum: ['W9', 'W8BEN', 'W8BENE', 'none'] },
    taxFormDocumentId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'OnboardingDocument' },
    taxIdLast4: { type: String },
    taxIdEncrypted: { type: String, select: false },
    taxIdIv: { type: String, select: false },
    usPerson: { type: Boolean },
    vatNumber: { type: String },
    withholdingRate: { type: Number, default: 0 },
    // Step 6
    kycStatus: { type: String, enum: ['not_started', 'pending', 'under_review', 'approved', 'failed'], default: 'not_started', index: true },
    kycDocumentType: { type: String, enum: ['passport', 'drivers_license', 'national_id'] },
    kycDocumentCountry: { type: String },
    kycDocumentId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'OnboardingDocument' },
    kycApprovedAt: { type: Date },
    kycApprovedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    // Step 7
    payoutMethod: { type: String, enum: ['ach', 'wire', 'paypal', 'jemdex', 'not_configured'], default: 'not_configured' },
    payoutCurrency: { type: String, default: 'USD' },
    payoutThreshold: { type: Number, default: 25 },
    payoutSchedule: { type: String, enum: ['monthly', 'quarterly', 'on_threshold'], default: 'monthly' },
    bankAccount: { type: BankAccountSchema },
    paypalEmail: { type: String },
    jemdexAccountId: { type: String },
    jemdexRegion: { type: String },
    // Step 8
    defaultSplits: { type: [exports.SplitPartySchema], default: [] },
    // Admin
    adminNotes: { type: String },
    flaggedForReview: { type: Boolean, default: false, index: true },
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});
ArtistProfileSchema.index({ onboardingStatus: 1, submittedAt: 1 });
ArtistProfileSchema.index({ stageName: 'text', legalName: 'text' });
exports.ArtistProfile = mongoose_1.default.model('ArtistProfile', ArtistProfileSchema);
//# sourceMappingURL=ArtistProfile.js.map