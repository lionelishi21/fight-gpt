import mongoose, { Document, Schema } from 'mongoose';

export interface ITrackSubmission extends Document {
    artistProfileId: mongoose.Types.ObjectId;
    splitSheetId?: mongoose.Types.ObjectId;
    title: string;
    featuredArtists?: string[];
    genre: string;
    subGenre?: string;
    releaseDate?: Date;
    audioFileKey: string;        // GCS/S3 object key
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

const TrackSubmissionSchema = new Schema({
    artistProfileId:        { type: Schema.Types.ObjectId, ref: 'ArtistProfile', required: true, index: true },
    splitSheetId:           { type: Schema.Types.ObjectId, ref: 'SplitSheet' },
    title:                  { type: String, required: true, index: true },
    featuredArtists:        { type: [String], default: [] },
    genre:                  { type: String, required: true },
    subGenre:               { type: String },
    releaseDate:            { type: Date },
    audioFileKey:           { type: String, required: true, select: false },
    audioFileMimeType:      { type: String, required: true },
    durationSeconds:        { type: Number },
    isrc:                   { type: String, index: true, sparse: true },
    upc:                    { type: String },
    contentRating:          { type: String, enum: ['clean','explicit'], required: true },
    artworkUrl:             { type: String },
    status:                 { type: String, enum: ['draft','submitted','under_review','approved','rejected','live','removed'], default: 'draft', index: true },
    rejectionReason:        { type: String },
    adminNotes:             { type: String },
    reviewedBy:             { type: Schema.Types.ObjectId, ref: 'User' },
    submittedAt:            { type: Date },
    approvedAt:             { type: Date },
    liveAt:                 { type: Date },
    fingerprintStatus:      { type: String, enum: ['not_run','pending','clear','match_found'], default: 'not_run' },
    fingerprintMatchDetails:{ type: String },
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

TrackSubmissionSchema.index({ artistProfileId: 1, status: 1 });

export const TrackSubmission = mongoose.model<ITrackSubmission>('TrackSubmission', TrackSubmissionSchema);
