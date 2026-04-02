import mongoose, { Schema, Document } from 'mongoose';

export interface IUserGame extends Document {
    user: mongoose.Types.ObjectId;
    game: mongoose.Types.ObjectId;
    character?: mongoose.Types.ObjectId; // Optional: user might just follow a game without a main
    planType: 'free' | 'premium';
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const UserGameSchema: Schema = new Schema(
    {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        game: { type: Schema.Types.ObjectId, ref: 'Game', required: true },
        character: { type: Schema.Types.ObjectId, ref: 'Character' },
        planType: {
            type: String,
            enum: ['free', 'premium'],
            default: 'free',
        },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

// Compound index to ensure a user can only have one active entry per game/character combination if needed,
// but for the "1 character per game" rule, we might need to enforce uniqueness on { user, game } for free tier in logic or strict index.
// For now, let's index for quick lookups.
UserGameSchema.index({ user: 1, game: 1 });

export default mongoose.model<IUserGame>('UserGame', UserGameSchema);
