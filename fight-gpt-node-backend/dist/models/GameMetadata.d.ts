import mongoose, { Document } from 'mongoose';
import { IGameMetadata } from '../types/gameMetadata';
/**
 * Game Metadata Document Interface
 */
export interface IGameMetadataDocument extends Omit<IGameMetadata, '_id'>, Document {
    _id: mongoose.Types.ObjectId;
}
/**
 * Game Metadata Model
 */
export declare const GameMetadata: mongoose.Model<IGameMetadataDocument, {}, {}, {}, mongoose.Document<unknown, {}, IGameMetadataDocument, {}, {}> & IGameMetadataDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=GameMetadata.d.ts.map