import mongoose, { Document } from 'mongoose';
export interface IMission extends Document {
    title: string;
    description: string;
    type: 'DRILL' | 'MATCHUP' | 'KNOWLEDGE';
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    reward: {
        xp: number;
        coins?: number;
    };
    criteria?: Record<string, any>;
    targetLink?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IMission, {}, {}, {}, mongoose.Document<unknown, {}, IMission, {}, {}> & IMission & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Mission.d.ts.map