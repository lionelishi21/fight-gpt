import mongoose, { Document, Schema } from 'mongoose';

export type IngestionJobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';

export interface IIngestionJob {
    job_id: string;
    game_id: string;
    youtube_url: string;
    video_title?: string;
    channel_name?: string;
    search_query: string;
    source: 'scheduled' | 'manual' | 'manual_seed' | 'tournament' | 'pro_scout' | 'startgg' | 'twitch';
    video_platform?: 'youtube' | 'twitch';
    // Pre-labeled metadata from start.gg or other sources (skips AI guessing)
    p1_name?: string;
    p2_name?: string;
    p1_character_id?: string;
    p2_character_id?: string;
    tournament_name?: string;
    status: IngestionJobStatus;
    error_message?: string;
    analysis_id?: string;
    scenario_count?: number;
    retry_count: number;
    processed_at?: Date;
    pro_player_id?: string;
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
    source: { type: String, enum: ['scheduled', 'manual', 'manual_seed', 'tournament', 'pro_scout', 'startgg', 'twitch'], default: 'scheduled' },
    video_platform: { type: String, enum: ['youtube', 'twitch'] },
    p1_name: { type: String },
    p2_name: { type: String },
    p1_character_id: { type: String },
    p2_character_id: { type: String },
    tournament_name: { type: String },
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
    pro_player_id: { type: String, index: true },
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
