import mongoose, { Schema, Document } from 'mongoose';

export interface IUserMission extends Document {
    user: mongoose.Types.ObjectId;
    mission: mongoose.Types.ObjectId;
    status: 'AVAILABLE' | 'PENDING' | 'COMPLETED' | 'FAILED';
    type: 'DAILY' | 'DRILL' | 'MATCHUP' | 'KNOWLEDGE';
    assignedDate: string;        // YYYY-MM-DD — lets same mission recur on different days
    completedAt?: Date;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}

const UserMissionSchema: Schema = new Schema(
    {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        mission: { type: Schema.Types.ObjectId, ref: 'Mission', required: true },
        status: {
            type: String,
            enum: ['AVAILABLE', 'PENDING', 'COMPLETED', 'FAILED'],
            default: 'AVAILABLE',
        },
        type: {
            type: String,
            enum: ['DAILY', 'DRILL', 'MATCHUP', 'KNOWLEDGE'],
            default: 'DAILY',
        },
        // Date the mission was assigned (YYYY-MM-DD). Allows the same mission
        // template to repeat on different days without hitting the unique index.
        assignedDate: {
            type: String,
            default: () => new Date().toISOString().slice(0, 10),
        },
        completedAt: { type: Date },
        metadata: { type: Schema.Types.Mixed },
    },
    { timestamps: true }
);

// Unique per user+mission+day — allows daily rotation without duplicates within a day
UserMissionSchema.index({ user: 1, mission: 1, assignedDate: 1 }, { unique: true });

export default mongoose.model<IUserMission>('UserMission', UserMissionSchema);
