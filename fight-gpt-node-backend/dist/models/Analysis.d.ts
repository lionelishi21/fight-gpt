import mongoose, { Document } from 'mongoose';
import { AnalysisResponse } from '../types';
/**
 * Analysis document interface extending mongoose Document
 */
export interface IAnalysis extends Document {
    youtube_url?: string;
    video_path?: string;
    video_source: 'youtube' | 'local_file';
    game_id?: string;
    user_id?: string;
    analysis: AnalysisResponse;
    analysis_id: string;
    p1_name?: string;
    p2_name?: string;
    created_at: Date;
    updated_at: Date;
}
/**
 * Analysis model
 */
export declare const Analysis: mongoose.Model<IAnalysis, {}, {}, {}, mongoose.Document<unknown, {}, IAnalysis, {}, {}> & IAnalysis & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Analysis.d.ts.map