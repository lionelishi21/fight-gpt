import mongoose, { Schema, Document } from 'mongoose';

export type EngagementTargetType = 'scenario' | 'theory' | 'match';

export interface IEngagement extends Document {
    userId: mongoose.Types.ObjectId;
    targetId: string; // The ID of the scenario or theory
    targetType: EngagementTargetType;
    rating: number; // 1 to 5
    comment?: string;
    isAiReviewTriggered: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const EngagementSchema: Schema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        targetId: { type: String, required: true, index: true },
        targetType: { 
            type: String, 
            enum: ['scenario', 'theory', 'match'], 
            required: true,
            index: true
        },
        rating: { type: Number, min: 1, max: 5, required: true },
        comment: { type: String },
        isAiReviewTriggered: { type: Boolean, default: false },
    },
    { timestamps: true }
);

// Unique index to prevent multiple ratings from same user on same target
EngagementSchema.index({ userId: 1, targetId: 1 }, { unique: true });

export default mongoose.model<IEngagement>('Engagement', EngagementSchema);
