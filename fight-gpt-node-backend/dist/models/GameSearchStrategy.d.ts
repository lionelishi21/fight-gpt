import mongoose, { Document } from 'mongoose';
export interface IGameSearchStrategy extends Document {
    game_id: string;
    queries: string[];
    patch_version: string;
    is_active: boolean;
    priority: number;
    created_at: Date;
    updated_at: Date;
}
export declare const GameSearchStrategy: mongoose.Model<IGameSearchStrategy, {}, {}, {}, mongoose.Document<unknown, {}, IGameSearchStrategy, {}, {}> & IGameSearchStrategy & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=GameSearchStrategy.d.ts.map