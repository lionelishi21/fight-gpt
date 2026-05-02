import mongoose, { Document } from 'mongoose';
export type EngagementTargetType = 'scenario' | 'theory' | 'match';
export interface IEngagement extends Document {
    userId: mongoose.Types.ObjectId;
    targetId: string;
    targetType: EngagementTargetType;
    rating: number;
    comment?: string;
    isAiReviewTriggered: boolean;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IEngagement, {}, {}, {}, mongoose.Document<unknown, {}, IEngagement, {}, {}> & IEngagement & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Engagement.d.ts.map