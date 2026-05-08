import mongoose, { Document, Schema } from 'mongoose';

export interface ISplitParty {
    name: string;
    email?: string;
    role: 'composer' | 'lyricist' | 'producer' | 'performer' | 'publisher' | 'co_writer';
    ipiNumber?: string;
    proAffiliation?: string;
    masterSplit: number;
    publishingSplit: number;
    acceptedAt?: Date;
}

export interface IBankAccount {
    bankName: string;
    accountHolderName: string;
    accountType: 'checking' | 'savings' | 'business';
    routingNumber?: string;
    accountNumberLast4?: string;
    swiftCode?: string;
    ibanLast4?: string;
    bankCountry: string;
    currency: string;
    verificationStatus: 'unverified' | 'micro_deposit_pending' | 'verified' | 'failed';
    verifiedAt?: Date;
}

export interface IArtistProfile extends Document {
    userId: mongoose.Types.ObjectId;
    onboardingStatus: 'draft' | 'pending_review' | 'under_review' | 'approved' | 'rejected' | 'suspended';
    onboardingStep: number;
    submittedAt?: Date;
    approvedAt?: Date;
    approvedBy?: mongoose.Types.ObjectId;
    rejectedAt?: Date;
    rejectedBy?: mongoose.Types.ObjectId;
    rejectionReason?: string;

    // Step 1 — Identity
    artistType: 'solo_artist' | 'band' | 'producer' | 'dj' | 'songwriter' | 'record_label' | 'collective';
    stageName: string;
    legalName: string;
    country: string;
    dateOfBirth?: Date;
    entityType?: 'individual' | 'sole_proprietor' | 'llc' | 'corporation' | 'partnership';

    // Step 2 — Profile
    bio?: string;
    genres: string[];
    subGenres?: string[];
    profileImageUrl?: string;
    bannerImageUrl?: string;
    socialLinks?: {
        spotify?: string;
        appleMusic?: string;
        instagram?: string;
        twitter?: string;
        tiktok?: string;
        youtube?: string;
        website?: string;
        soundcloud?: string;
    };

    // Step 3 — Industry IDs
    isni?: string;
    ipiCaeNumber?: string;
    proAffiliation?: string;
    proMembershipNumber?: string;
    hasPublisher: boolean;
    publisherName?: string;
    publisherIPI?: string;

    // Step 4 — Rights & Legal
    masterOwnership?: 'full' | 'partial' | 'label_owned';
    publishingOwnership?: 'full' | 'partial' | 'co_published' | 'label_owned';
    distributionType?: 'exclusive' | 'non_exclusive';
    distributionTerritories?: string[];
    hasExistingDistribution?: boolean;
    existingDistributors?: string[];
    contentRating?: 'clean' | 'explicit' | 'mixed';
    agreedToTOS: boolean;
    tosAgreedAt?: Date;
    tosVersion?: string;
    tosAgreedIp?: string;
    agreedToDistributionAgreement: boolean;
    distributionAgreementSignedAt?: Date;
    agreedToContentPolicy: boolean;
    contentPolicyAgreedAt?: Date;

    // Step 5 — Tax
    taxCountry?: string;
    taxFormType?: 'W9' | 'W8BEN' | 'W8BENE' | 'none';
    taxFormDocumentId?: mongoose.Types.ObjectId;
    taxIdLast4?: string;
    taxIdEncrypted?: string;
    taxIdIv?: string;
    usPerson?: boolean;
    vatNumber?: string;
    withholdingRate?: number;

    // Step 6 — KYC
    kycStatus: 'not_started' | 'pending' | 'under_review' | 'approved' | 'failed';
    kycDocumentType?: 'passport' | 'drivers_license' | 'national_id';
    kycDocumentCountry?: string;
    kycDocumentId?: mongoose.Types.ObjectId;
    kycApprovedAt?: Date;
    kycApprovedBy?: mongoose.Types.ObjectId;

    // Step 7 — Payout
    payoutMethod: 'ach' | 'wire' | 'paypal' | 'jemdex' | 'not_configured';
    payoutCurrency?: string;
    payoutThreshold?: number;
    payoutSchedule?: 'monthly' | 'quarterly' | 'on_threshold';
    bankAccount?: IBankAccount;
    paypalEmail?: string;
    jemdexAccountId?: string;
    jemdexRegion?: string;

    // Step 8 — Splits
    defaultSplits?: ISplitParty[];

    // Admin
    adminNotes?: string;
    flaggedForReview: boolean;

    created_at: Date;
    updated_at: Date;
}

export const SplitPartySchema = new Schema({
    name:             { type: String, required: true },
    email:            { type: String },
    role:             { type: String, enum: ['composer','lyricist','producer','performer','publisher','co_writer'], required: true },
    ipiNumber:        { type: String },
    proAffiliation:   { type: String },
    masterSplit:      { type: Number, required: true, min: 0, max: 100 },
    publishingSplit:  { type: Number, required: true, min: 0, max: 100 },
    acceptedAt:       { type: Date },
}, { _id: false });

const BankAccountSchema = new Schema({
    bankName:             { type: String, required: true },
    accountHolderName:    { type: String, required: true },
    accountType:          { type: String, enum: ['checking','savings','business'], required: true },
    routingNumber:        { type: String },
    accountNumberLast4:   { type: String },
    swiftCode:            { type: String },
    ibanLast4:            { type: String },
    bankCountry:          { type: String, required: true },
    currency:             { type: String, required: true },
    verificationStatus:   { type: String, enum: ['unverified','micro_deposit_pending','verified','failed'], default: 'unverified' },
    verifiedAt:           { type: Date },
}, { _id: false });

const ArtistProfileSchema = new Schema({
    userId:             { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    onboardingStatus:   { type: String, enum: ['draft','pending_review','under_review','approved','rejected','suspended'], default: 'draft', index: true },
    onboardingStep:     { type: Number, default: 1, min: 1, max: 8 },
    submittedAt:        { type: Date },
    approvedAt:         { type: Date },
    approvedBy:         { type: Schema.Types.ObjectId, ref: 'User' },
    rejectedAt:         { type: Date },
    rejectedBy:         { type: Schema.Types.ObjectId, ref: 'User' },
    rejectionReason:    { type: String },

    // Step 1
    artistType:     { type: String, enum: ['solo_artist','band','producer','dj','songwriter','record_label','collective'], index: true },
    stageName:      { type: String, index: true },
    legalName:      { type: String, index: true },
    country:        { type: String, index: true },
    dateOfBirth:    { type: Date },
    entityType:     { type: String, enum: ['individual','sole_proprietor','llc','corporation','partnership'] },

    // Step 2
    bio:              { type: String, maxlength: 2000 },
    genres:           { type: [String], default: [] },
    subGenres:        { type: [String], default: [] },
    profileImageUrl:  { type: String },
    bannerImageUrl:   { type: String },
    socialLinks:      { type: Schema.Types.Mixed, default: {} },

    // Step 3
    isni:                 { type: String },
    ipiCaeNumber:         { type: String },
    proAffiliation:       { type: String },
    proMembershipNumber:  { type: String },
    hasPublisher:         { type: Boolean, default: false },
    publisherName:        { type: String },
    publisherIPI:         { type: String },

    // Step 4
    masterOwnership:             { type: String, enum: ['full','partial','label_owned'] },
    publishingOwnership:         { type: String, enum: ['full','partial','co_published','label_owned'] },
    distributionType:            { type: String, enum: ['exclusive','non_exclusive'] },
    distributionTerritories:     { type: [String], default: ['worldwide'] },
    hasExistingDistribution:     { type: Boolean, default: false },
    existingDistributors:        { type: [String], default: [] },
    contentRating:               { type: String, enum: ['clean','explicit','mixed'] },
    agreedToTOS:                 { type: Boolean, default: false, index: true },
    tosAgreedAt:                 { type: Date },
    tosVersion:                  { type: String },
    tosAgreedIp:                 { type: String },
    agreedToDistributionAgreement: { type: Boolean, default: false },
    distributionAgreementSignedAt: { type: Date },
    agreedToContentPolicy:       { type: Boolean, default: false },
    contentPolicyAgreedAt:       { type: Date },

    // Step 5
    taxCountry:          { type: String },
    taxFormType:         { type: String, enum: ['W9','W8BEN','W8BENE','none'] },
    taxFormDocumentId:   { type: Schema.Types.ObjectId, ref: 'OnboardingDocument' },
    taxIdLast4:          { type: String },
    taxIdEncrypted:      { type: String, select: false },
    taxIdIv:             { type: String, select: false },
    usPerson:            { type: Boolean },
    vatNumber:           { type: String },
    withholdingRate:     { type: Number, default: 0 },

    // Step 6
    kycStatus:          { type: String, enum: ['not_started','pending','under_review','approved','failed'], default: 'not_started', index: true },
    kycDocumentType:    { type: String, enum: ['passport','drivers_license','national_id'] },
    kycDocumentCountry: { type: String },
    kycDocumentId:      { type: Schema.Types.ObjectId, ref: 'OnboardingDocument' },
    kycApprovedAt:      { type: Date },
    kycApprovedBy:      { type: Schema.Types.ObjectId, ref: 'User' },

    // Step 7
    payoutMethod:    { type: String, enum: ['ach','wire','paypal','jemdex','not_configured'], default: 'not_configured' },
    payoutCurrency:  { type: String, default: 'USD' },
    payoutThreshold: { type: Number, default: 25 },
    payoutSchedule:  { type: String, enum: ['monthly','quarterly','on_threshold'], default: 'monthly' },
    bankAccount:     { type: BankAccountSchema },
    paypalEmail:     { type: String },
    jemdexAccountId: { type: String },
    jemdexRegion:    { type: String },

    // Step 8
    defaultSplits: { type: [SplitPartySchema], default: [] },

    // Admin
    adminNotes:       { type: String },
    flaggedForReview: { type: Boolean, default: false, index: true },
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

ArtistProfileSchema.index({ onboardingStatus: 1, submittedAt: 1 });
ArtistProfileSchema.index({ stageName: 'text', legalName: 'text' });

export const ArtistProfile = mongoose.model<IArtistProfile>('ArtistProfile', ArtistProfileSchema);
