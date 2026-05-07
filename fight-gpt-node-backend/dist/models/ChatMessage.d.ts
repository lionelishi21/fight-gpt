import mongoose, { Document } from 'mongoose';
export interface IChatMessage extends Document {
    userId: mongoose.Types.ObjectId;
    role: 'user' | 'assistant';
    content: string;
    metadata?: {
        detectedEntities?: any[];
        gameId?: string;
        characterId?: string;
    };
    createdAt: Date;
}
declare const _default: mongoose.Model<IChatMessage, {}, {}, {}, mongoose.Document<unknown, {}, IChatMessage, {}, {}> & IChatMessage & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=ChatMessage.d.ts.map