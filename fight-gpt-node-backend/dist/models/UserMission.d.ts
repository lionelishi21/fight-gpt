import mongoose, { Document } from 'mongoose';
export interface IUserMission extends Document {
    user: mongoose.Types.ObjectId;
    mission: mongoose.Types.ObjectId;
    status: 'PENDING' | 'COMPLETED';
    completedAt?: Date;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IUserMission, {}, {}, {}, mongoose.Document<unknown, {}, IUserMission, {}, {}> & IUserMission & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=UserMission.d.ts.map