import mongoose, { Schema, Document } from 'mongoose';

export interface IMission extends Document {
    title: string;
    description: string;
    type: 'DRILL' | 'MATCHUP' | 'KNOWLEDGE';
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    reward: {
        xp: number;
        coins?: number;
    };
    criteria?: Record<string, any>; // Flexible criteria for future automated checking
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const MissionSchema: Schema = new Schema(
    {
        title: { type: String, required: true },
        description: { type: String, required: true },
        type: {
            type: String,
            enum: ['DRILL', 'MATCHUP', 'KNOWLEDGE'],
            default: 'DRILL',
        },
        difficulty: {
            type: String,
            enum: ['EASY', 'MEDIUM', 'HARD'],
            default: 'EASY',
        },
        reward: {
            xp: { type: Number, required: true, default: 100 },
            coins: { type: Number, default: 0 },
        },
        criteria: { type: Schema.Types.Mixed }, // JSON for flexible criteria
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

export default mongoose.model<IMission>('Mission', MissionSchema);
