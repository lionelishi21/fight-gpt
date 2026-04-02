import mongoose, { Document, Schema } from 'mongoose';

export interface IAnalyticsEvent {
    event_type: 'game_metadata_query' | 'character_encyclopedia_query' | 'game_rule_query' | 'analyze_video';
    game_id: string;
    character_id?: string;
    rule_key?: string; // Which specific game rule was queried most
    user_id?: string;
    metadata?: Record<string, any>;
    created_at?: Date;
}

export interface IAnalyticsEventDocument extends IAnalyticsEvent, Document {
    _id: mongoose.Types.ObjectId;
}

const AnalyticsEventSchema = new Schema<IAnalyticsEventDocument>({
    event_type: {
        type: String,
        enum: ['game_metadata_query', 'character_encyclopedia_query', 'game_rule_query', 'analyze_video'],
        required: true
    },
    game_id: { type: String, required: true, index: true },
    character_id: { type: String, index: true },
    rule_key: { type: String, index: true },
    user_id: { type: String },
    metadata: { type: Schema.Types.Mixed }
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: false // Only insert events, no updates needed
    }
});

// Index for getting popular rules
AnalyticsEventSchema.index({ event_type: 1, rule_key: 1 });

export const AnalyticsEvent = mongoose.model<IAnalyticsEventDocument>('AnalyticsEvent', AnalyticsEventSchema);
