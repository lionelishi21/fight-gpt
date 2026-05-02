import mongoose, { Document } from 'mongoose';
import { IGame } from '../types/game';
/**
 * Game document interface extending mongoose Document
 */
export interface IGameDocument extends Omit<IGame, '_id'>, Document {
    _id: mongoose.Types.ObjectId;
}
/**
 * Game model
 */
export declare const Game: mongoose.Model<IGameDocument, {}, {}, {}, mongoose.Document<unknown, {}, IGameDocument, {}, {}> & IGameDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Game.d.ts.map