import mongoose, { Document } from 'mongoose';
import { ICharacter } from '../types/character';
/**
 * Character document interface extending mongoose Document
 */
export interface ICharacterDocument extends Omit<ICharacter, '_id'>, Document {
    _id: mongoose.Types.ObjectId;
}
/**
 * Character model
 */
export declare const Character: mongoose.Model<ICharacterDocument, {}, {}, {}, mongoose.Document<unknown, {}, ICharacterDocument, {}, {}> & ICharacterDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Character.d.ts.map