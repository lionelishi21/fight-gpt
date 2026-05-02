import mongoose, { Document } from 'mongoose';
export interface IProPlayer {
    name: string;
    gameId: string;
    region: 'Global' | 'Japan' | 'USA' | 'Europe' | 'Other';
    description?: string;
    channels: string[];
    isVerified: boolean;
    lastIngestJobAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}
export interface IProPlayerDocument extends IProPlayer, Document {
}
export declare const ProPlayer: mongoose.Model<IProPlayerDocument, {}, {}, {}, mongoose.Document<unknown, {}, IProPlayerDocument, {}, {}> & IProPlayerDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=ProPlayer.d.ts.map