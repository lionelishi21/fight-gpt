import mongoose, { Schema, Document } from 'mongoose';

export interface IUserMission extends Document {
    user: mongoose.Types.ObjectId;
    mission: mongoose.Types.ObjectId;
    status: 'PENDING' | 'COMPLETED' | 'FAILED';
    completedAt?: Date;
    metadata?: Record<string, any>; // Store relevant data like "10/10 anti-airs"
    createdAt: Date;
    updatedAt: Date;
}

const UserMissionSchema: Schema = new Schema(
    {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        mission: { type: Schema.Types.ObjectId, ref: 'Mission', required: true },
        status: {
            type: String,
            enum: ['PENDING', 'COMPLETED', 'FAILED'],
            default: 'PENDING',
        },
        completedAt: { type: Date },
        metadata: { type: Schema.Types.Mixed },
    },
    { timestamps: true }
);

// Ensure a user has unique entry per mission (unless we want repeatable dailies,
// but for now let's unique per mission ID. For dailies, we might rotate mission IDs or add a date field)
UserMissionSchema.index({ user: 1, mission: 1 }, { unique: true });

export default mongoose.model<IUserMission>('UserMission', UserMissionSchema);
