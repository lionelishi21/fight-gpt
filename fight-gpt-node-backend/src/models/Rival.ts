import mongoose, { Document, Schema } from 'mongoose';

export interface IRival {
    userId: mongoose.Types.ObjectId;
    targetName: string; // The In-game Name (IGN) to track
    gameId: string;
    notes?: string;
    metaDiscoveryOnly: boolean; // Only alert if they find novel tech
    lastSpottedAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IRivalDocument extends IRival, Document {}

const RivalSchema = new Schema<IRivalDocument>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    targetName: { type: String, required: true, index: true },
    gameId: { type: String, required: true, index: true },
    notes: { type: String },
    metaDiscoveryOnly: { type: Boolean, default: false },
    lastSpottedAt: { type: Date },
}, {
    timestamps: true
});

// Unique constraint: A user can't track the same rival twice for the same game
RivalSchema.index({ userId: 1, targetName: 1, gameId: 1 }, { unique: true });

export const Rival = mongoose.model<IRivalDocument>('Rival', RivalSchema);
