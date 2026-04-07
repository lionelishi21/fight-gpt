import mongoose, { Document, Schema } from 'mongoose';

export interface IProPlayer {
    name: string; // The Pro's name (e.g., "Punk", "Tokido")
    gameId: string;
    description?: string;
    channels: string[]; // YouTube channel IDs or URLs to monitor
    isVerified: boolean; // System-vetted pro
    lastIngestJobAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IProPlayerDocument extends IProPlayer, Document {}

const ProPlayerSchema = new Schema<IProPlayerDocument>({
    name: { type: String, required: true, index: true },
    gameId: { type: String, required: true, index: true },
    description: { type: String },
    channels: [{ type: String }],
    isVerified: { type: Boolean, default: false },
    lastIngestJobAt: { type: Date },
}, {
    timestamps: true
});

ProPlayerSchema.index({ name: 1, gameId: 1 }, { unique: true });

export const ProPlayer = mongoose.model<IProPlayerDocument>('ProPlayer', ProPlayerSchema);
