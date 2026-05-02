import mongoose, { Document } from 'mongoose';
export interface ICharacterMetaStat {
    character_id: string;
    character_name: string;
    usage_count: number;
    win_count: number;
    win_rate: number;
    trend: 'rising' | 'falling' | 'stable';
    top_strategies: string[];
}
export interface IMatchupInsight {
    character_a: string;
    character_b: string;
    win_rate_a: number;
    dominant_strategy: string;
    sample_size: number;
}
export interface IMetaReport {
    report_id: string;
    game_id: string;
    period: 'weekly' | 'patch' | 'monthly';
    patch_version?: string;
    generated_at: Date;
    status: 'generating' | 'ready' | 'error';
    error_message?: string;
    tier_list: ICharacterMetaStat[];
    trending_characters: {
        rising: string[];
        falling: string[];
    };
    dominant_strategies: string[];
    matchup_insights: IMatchupInsight[];
    meta_summary: string;
    patch_impact_summary?: string;
    source_scenario_count: number;
    source_video_count: number;
    created_at?: Date;
    updated_at?: Date;
}
export interface IMetaReportDocument extends IMetaReport, Document {
    _id: mongoose.Types.ObjectId;
}
export declare const MetaReport: mongoose.Model<IMetaReportDocument, {}, {}, {}, mongoose.Document<unknown, {}, IMetaReportDocument, {}, {}> & IMetaReportDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=MetaReport.d.ts.map