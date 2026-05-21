import mongoose, { Schema } from 'mongoose';

export interface IResearchLog {
    game_id: string;
    run_at: Date;
    triggered_by: 'cron' | 'manual';
    scenarios_generated: number;
    theories_generated: number;
    characters_covered: string[];
    videos_processed: number;
    errors: string[];
    duration_ms: number;
    status: 'success' | 'partial' | 'failed';
}

const schema = new Schema<IResearchLog>({
    game_id:             { type: String, required: true, index: true },
    run_at:              { type: Date, default: Date.now, index: true },
    triggered_by:        { type: String, enum: ['cron', 'manual'], default: 'cron' },
    scenarios_generated: { type: Number, default: 0 },
    theories_generated:  { type: Number, default: 0 },
    characters_covered:  [{ type: String }],
    videos_processed:    { type: Number, default: 0 },
    errors:              [{ type: String }],
    duration_ms:         { type: Number, default: 0 },
    status:              { type: String, enum: ['success', 'partial', 'failed'], default: 'success' },
}, { timestamps: false });

export const ResearchLog = mongoose.model<IResearchLog>('ResearchLog', schema);
