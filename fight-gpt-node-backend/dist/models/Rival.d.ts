import mongoose, { Document } from 'mongoose';
export interface IRival {
    userId: mongoose.Types.ObjectId;
    targetName: string;
    gameId: string;
    notes?: string;
    metaDiscoveryOnly: boolean;
    lastSpottedAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}
export interface IRivalDocument extends IRival, Document {
}
export declare const Rival: mongoose.Model<IRivalDocument, {}, {}, {}, mongoose.Document<unknown, {}, IRivalDocument, {}, {}> & IRivalDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Rival.d.ts.map