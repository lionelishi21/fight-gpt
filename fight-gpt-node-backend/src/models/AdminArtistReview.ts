import mongoose, { Document, Schema } from 'mongoose';

export interface IAdminArtistReview extends Document {
    artistProfileId: mongoose.Types.ObjectId;
    reviewType: 'initial_approval' | 'document_review' | 'kyc_review' | 'track_review' | 'periodic_review';
    assignedTo?: mongoose.Types.ObjectId;
    status: 'queued' | 'in_progress' | 'approved' | 'rejected' | 'more_info_requested';
    priority: 'low' | 'normal' | 'high' | 'urgent';
    checklist: {
        item: string;
        passed?: boolean;
        notes?: string;
        checkedAt?: Date;
    }[];
    comments: {
        authorId: mongoose.Types.ObjectId;
        text: string;
        createdAt: Date;
        isInternal: boolean;
    }[];
    outcome?: 'approved' | 'rejected' | 'more_info_requested';
    outcomeNotes?: string;
    outcomeAt?: Date;
    created_at: Date;
    updated_at: Date;
}

const ReviewChecklistItem = new Schema({
    item:      { type: String, required: true },
    passed:    { type: Boolean },
    notes:     { type: String },
    checkedAt: { type: Date },
}, { _id: false });

const ReviewComment = new Schema({
    authorId:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
    text:       { type: String, required: true },
    createdAt:  { type: Date, default: Date.now },
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

const AdminArtistReviewSchema = new Schema({
    artistProfileId: { type: Schema.Types.ObjectId, ref: 'ArtistProfile', required: true, index: true },
    reviewType:      { type: String, enum: ['initial_approval','document_review','kyc_review','track_review','periodic_review'], required: true },
    assignedTo:      { type: Schema.Types.ObjectId, ref: 'User', index: true },
    status:          { type: String, enum: ['queued','in_progress','approved','rejected','more_info_requested'], default: 'queued', index: true },
    priority:        { type: String, enum: ['low','normal','high','urgent'], default: 'normal', index: true },
    checklist:       {
        type: [ReviewChecklistItem],
        default: () => DEFAULT_CHECKLIST.map(item => ({ item, passed: undefined })),
    },
    comments:     { type: [ReviewComment], default: [] },
    outcome:      { type: String, enum: ['approved','rejected','more_info_requested'] },
    outcomeNotes: { type: String },
    outcomeAt:    { type: Date },
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

AdminArtistReviewSchema.index({ status: 1, priority: -1, created_at: 1 });

export const AdminArtistReview = mongoose.model<IAdminArtistReview>('AdminArtistReview', AdminArtistReviewSchema);
