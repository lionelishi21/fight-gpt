import mongoose, { Document, Schema } from 'mongoose';

export type DocumentType =
    | 'government_id_front' | 'government_id_back' | 'passport'
    | 'proof_of_address' | 'tax_form_w9' | 'tax_form_w8ben' | 'tax_form_w8bene'
    | 'distribution_agreement_signed' | 'split_sheet' | 'publishing_agreement'
    | 'master_ownership_declaration' | 'copyright_registration' | 'label_agreement'
    | 'profile_image' | 'banner_image' | 'audio_track' | 'track_artwork' | 'other';

export interface IOnboardingDocument extends Document {
    artistProfileId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    documentType: DocumentType;
    originalFilename: string;
    storageKey: string;       // GCS/S3 object key (internal, never exposed)
    publicUrl?: string;       // CDN URL for images only
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

const OnboardingDocumentSchema = new Schema({
    artistProfileId: { type: Schema.Types.ObjectId, ref: 'ArtistProfile', required: true, index: true },
    userId:          { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    documentType:    { type: String, required: true, index: true },
    originalFilename:{ type: String, required: true },
    storageKey:      { type: String, required: true, select: false },
    publicUrl:       { type: String },
    mimeType:        { type: String, required: true },
    fileSizeBytes:   { type: Number, required: true },
    uploadedAt:      { type: Date, default: Date.now },
    status:          { type: String, enum: ['uploaded','under_review','accepted','rejected'], default: 'uploaded', index: true },
    rejectionReason: { type: String },
    reviewedBy:      { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt:      { type: Date },
    expiresAt:       { type: Date },
    checksum:        { type: String, required: true },
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

export const OnboardingDocument = mongoose.model<IOnboardingDocument>('OnboardingDocument', OnboardingDocumentSchema);
