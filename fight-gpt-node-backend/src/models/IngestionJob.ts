import mongoose, { Document, Schema } from 'mongoose';

export type IngestionJobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';

export interface IIngestionJob {
    job_id: string;
    game_id: string;
    youtube_url: string;
    video_title?: string;
    channel_name?: string;
    search_query: string;         // The query that surfaced this video
    source: 'scheduled' | 'manual' | 'tournament';
    status: IngestionJobStatus;
    error_message?: string;
    analysis_id?: string;         // Linked analysis result once processed
    scenario_count?: number;      // Number of scenarios extracted
    retry_count: number;
    processed_at?: Date;
    created_at?: Date;
    updated_at?: Date;
}

export interface IIngestionJobDocument extends IIngestionJob, Document {
    _id: mongoose.Types.ObjectId;
}

const IngestionJobSchema = new Schema<IIngestionJobDocument>({
    job_id: { type: String, required: true, unique: true, index: true },
    game_id: { type: String, required: true, index: true },
    youtube_url: { type: String, required: true },
    video_title: { type: String },
    channel_name: { type: String },
    search_query: { type: String, required: true },
    source: { type: String, enum: ['scheduled', 'manual', 'tournament'], default: 'scheduled' },
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed', 'skipped'],
        default: 'pending',
        index: true,
    },
    error_message: { type: String },
    analysis_id: { type: String },
    scenario_count: { type: Number },
    retry_count: { type: Number, default: 0 },
    processed_at: { type: Date },
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    },
});

// Prevent duplicate ingestion of the same video
IngestionJobSchema.index({ youtube_url: 1 }, { unique: true });
IngestionJobSchema.index({ game_id: 1, status: 1 });
IngestionJobSchema.index({ game_id: 1, created_at: -1 });

export const IngestionJob = mongoose.model<IIngestionJobDocument>('IngestionJob', IngestionJobSchema);
