import mongoose, { Document } from 'mongoose';
export type DocumentType = 'government_id_front' | 'government_id_back' | 'passport' | 'proof_of_address' | 'tax_form_w9' | 'tax_form_w8ben' | 'tax_form_w8bene' | 'distribution_agreement_signed' | 'split_sheet' | 'publishing_agreement' | 'master_ownership_declaration' | 'copyright_registration' | 'label_agreement' | 'profile_image' | 'banner_image' | 'audio_track' | 'track_artwork' | 'other';
export interface IOnboardingDocument extends Document {
    artistProfileId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    documentType: DocumentType;
    originalFilename: string;
    storageKey: string;
    publicUrl?: string;
    mimeType: string;
    fileSizeBytes: number;
    uploadedAt: Date;
    status: 'uploaded' | 'under_review' | 'accepted' | 'rejected';
    rejectionReason?: string;
    reviewedBy?: mongoose.Types.ObjectId;
    reviewedAt?: Date;
    expiresAt?: Date;
    checksum: string;
}
export declare const OnboardingDocument: mongoose.Model<IOnboardingDocument, {}, {}, {}, mongoose.Document<unknown, {}, IOnboardingDocument, {}, {}> & IOnboardingDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=OnboardingDocument.d.ts.map