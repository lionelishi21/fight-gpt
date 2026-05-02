import mongoose, { Document } from 'mongoose';
import { IMatch } from '../types/match';
export interface IMatchDocument extends IMatch, Document {
    _id: mongoose.Types.ObjectId;
}
export declare const Match: mongoose.Model<IMatchDocument, {}, {}, {}, mongoose.Document<unknown, {}, IMatchDocument, {}, {}> & IMatchDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Match.d.ts.map