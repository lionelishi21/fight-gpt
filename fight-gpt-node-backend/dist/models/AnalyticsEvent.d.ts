import mongoose, { Document } from 'mongoose';
export interface IAnalyticsEvent {
    event_type: 'game_metadata_query' | 'character_encyclopedia_query' | 'game_rule_query' | 'analyze_video';
    game_id: string;
    character_id?: string;
    rule_key?: string;
    user_id?: string;
    metadata?: Record<string, any>;
    created_at?: Date;
}
export interface IAnalyticsEventDocument extends IAnalyticsEvent, Document {
    _id: mongoose.Types.ObjectId;
}
export declare const AnalyticsEvent: mongoose.Model<IAnalyticsEventDocument, {}, {}, {}, mongoose.Document<unknown, {}, IAnalyticsEventDocument, {}, {}> & IAnalyticsEventDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=AnalyticsEvent.d.ts.map