import mongoose, { Document } from 'mongoose';
export interface ITrackSubmission extends Document {
    artistProfileId: mongoose.Types.ObjectId;
    splitSheetId?: mongoose.Types.ObjectId;
    title: string;
    featuredArtists?: string[];
    genre: string;
    subGenre?: string;
    releaseDate?: Date;
    audioFileKey: string;
    audioFileMimeType: string;
    durationSeconds?: number;
    isrc?: string;
    upc?: string;
    contentRating: 'clean' | 'explicit';
    artworkUrl?: string;
    status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'live' | 'removed';
    rejectionReason?: string;
    adminNotes?: string;
    reviewedBy?: mongoose.Types.ObjectId;
    submittedAt?: Date;
    approvedAt?: Date;
    liveAt?: Date;
    fingerprintStatus: 'not_run' | 'pending' | 'clear' | 'match_found';
    fingerprintMatchDetails?: string;
    created_at: Date;
    updated_at: Date;
}
export declare const TrackSubmission: mongoose.Model<ITrackSubmission, {}, {}, {}, mongoose.Document<unknown, {}, ITrackSubmission, {}, {}> & ITrackSubmission & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=TrackSubmission.d.ts.map