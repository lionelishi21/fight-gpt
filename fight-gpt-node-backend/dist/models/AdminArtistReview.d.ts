import mongoose, { Document } from 'mongoose';
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
export declare const AdminArtistReview: mongoose.Model<IAdminArtistReview, {}, {}, {}, mongoose.Document<unknown, {}, IAdminArtistReview, {}, {}> & IAdminArtistReview & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=AdminArtistReview.d.ts.map