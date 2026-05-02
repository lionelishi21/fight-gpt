import mongoose, { Document } from 'mongoose';
export interface IUserGame extends Document {
    user: mongoose.Types.ObjectId;
    game: mongoose.Types.ObjectId;
    character?: mongoose.Types.ObjectId;
    planType: 'free' | 'premium';
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IUserGame, {}, {}, {}, mongoose.Document<unknown, {}, IUserGame, {}, {}> & IUserGame & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=UserGame.d.ts.map