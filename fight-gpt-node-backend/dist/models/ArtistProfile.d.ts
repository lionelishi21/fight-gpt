import mongoose, { Document } from 'mongoose';
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
    artistType: 'solo_artist' | 'band' | 'producer' | 'dj' | 'songwriter' | 'record_label' | 'collective';
    stageName: string;
    legalName: string;
    country: string;
    dateOfBirth?: Date;
    entityType?: 'individual' | 'sole_proprietor' | 'llc' | 'corporation' | 'partnership';
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
    isni?: string;
    ipiCaeNumber?: string;
    proAffiliation?: string;
    proMembershipNumber?: string;
    hasPublisher: boolean;
    publisherName?: string;
    publisherIPI?: string;
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
    taxCountry?: string;
    taxFormType?: 'W9' | 'W8BEN' | 'W8BENE' | 'none';
    taxFormDocumentId?: mongoose.Types.ObjectId;
    taxIdLast4?: string;
    taxIdEncrypted?: string;
    taxIdIv?: string;
    usPerson?: boolean;
    vatNumber?: string;
    withholdingRate?: number;
    kycStatus: 'not_started' | 'pending' | 'under_review' | 'approved' | 'failed';
    kycDocumentType?: 'passport' | 'drivers_license' | 'national_id';
    kycDocumentCountry?: string;
    kycDocumentId?: mongoose.Types.ObjectId;
    kycApprovedAt?: Date;
    kycApprovedBy?: mongoose.Types.ObjectId;
    payoutMethod: 'ach' | 'wire' | 'paypal' | 'jemdex' | 'not_configured';
    payoutCurrency?: string;
    payoutThreshold?: number;
    payoutSchedule?: 'monthly' | 'quarterly' | 'on_threshold';
    bankAccount?: IBankAccount;
    paypalEmail?: string;
    jemdexAccountId?: string;
    jemdexRegion?: string;
    defaultSplits?: ISplitParty[];
    adminNotes?: string;
    flaggedForReview: boolean;
    created_at: Date;
    updated_at: Date;
}
export declare const SplitPartySchema: mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    _id: false;
}, {
    name: string;
    role: "publisher" | "composer" | "lyricist" | "producer" | "performer" | "co_writer";
    masterSplit: number;
    publishingSplit: number;
    email?: string;
    ipiNumber?: string;
    proAffiliation?: string;
    acceptedAt?: NativeDate;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    name: string;
    role: "publisher" | "composer" | "lyricist" | "producer" | "performer" | "co_writer";
    masterSplit: number;
    publishingSplit: number;
    email?: string;
    ipiNumber?: string;
    proAffiliation?: string;
    acceptedAt?: NativeDate;
}>, {}, mongoose.ResolveSchemaOptions<{
    _id: false;
}>> & mongoose.FlatRecord<{
    name: string;
    role: "publisher" | "composer" | "lyricist" | "producer" | "performer" | "co_writer";
    masterSplit: number;
    publishingSplit: number;
    email?: string;
    ipiNumber?: string;
    proAffiliation?: string;
    acceptedAt?: NativeDate;
}> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
export declare const ArtistProfile: mongoose.Model<IArtistProfile, {}, {}, {}, mongoose.Document<unknown, {}, IArtistProfile, {}, {}> & IArtistProfile & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=ArtistProfile.d.ts.map