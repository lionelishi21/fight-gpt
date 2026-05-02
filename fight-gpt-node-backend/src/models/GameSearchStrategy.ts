import mongoose, { Document, Schema } from 'mongoose';

export interface IGameSearchStrategy extends Document {
    game_id: string;
    queries: string[];
    patch_version: string;
    is_active: boolean;
    priority: number;   // 0 = normal, 1 = high (e.g. right after a patch drop)
    created_at: Date;
    updated_at: Date;
}

const GameSearchStrategySchema = new Schema(
    {
        game_id:       { type: String, required: true, index: true },
        queries:       { type: [String], required: true },
        patch_version: { type: String, required: true, default: 'latest' },
        is_active:     { type: Boolean, required: true, default: true, index: true },
        priority:      { type: Number, required: true, default: 0, index: true },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    }
);

GameSearchStrategySchema.index({ game_id: 1, is_active: 1, priority: -1 });

export const GameSearchStrategy = mongoose.model<IGameSearchStrategy>(
    'GameSearchStrategy',
    GameSearchStrategySchema
);
