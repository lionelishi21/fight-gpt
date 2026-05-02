import mongoose, { Document } from 'mongoose';
export type IngestionJobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';
export interface IIngestionJob {
    job_id: string;
    game_id: string;
    youtube_url: string;
    video_title?: string;
    channel_name?: string;
    search_query: string;
    source: 'scheduled' | 'manual' | 'tournament' | 'pro_scout';
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
export declare const IngestionJob: mongoose.Model<IIngestionJobDocument, {}, {}, {}, mongoose.Document<unknown, {}, IIngestionJobDocument, {}, {}> & IIngestionJobDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=IngestionJob.d.ts.map