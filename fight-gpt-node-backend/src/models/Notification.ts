import mongoose, { Schema, Document } from 'mongoose';

export type NotificationType =
  | 'TECH_DISCOVERY'
  | 'META_SHIFT'
  | 'RIVAL_WATCH'
  | 'PRO_SCOUT'
  | 'NEW_COMBO'
  | 'PATCH_BRIEF'
  | 'CHARACTER_THEORY'
  | 'MATCHUP_THEORY'
  | 'ANALYSIS_COMPLETE'
  | 'RANK_UP'
  | 'VECTOR_INSIGHT'
  | 'TIER_LIST_UPDATE'
  | 'SYSTEM_ALERT';

export type NotificationSeverity = 'low' | 'medium' | 'high';

export interface INotification extends Document {
    userId: mongoose.Types.ObjectId;
    type: NotificationType;
    severity: NotificationSeverity;
    payload: {
        gameId: string;
        characterId?: string;
        title: string;
        description: string;
        link?: string;
        timestamp?: string;
        data?: any;
    };
    isRead: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const NotificationSchema: Schema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        type: {
            type: String,
            enum: [
                'TECH_DISCOVERY', 'META_SHIFT', 'RIVAL_WATCH', 'PRO_SCOUT',
                'NEW_COMBO', 'PATCH_BRIEF', 'CHARACTER_THEORY', 'MATCHUP_THEORY',
                'ANALYSIS_COMPLETE', 'RANK_UP', 'VECTOR_INSIGHT', 'TIER_LIST_UPDATE',
                'SYSTEM_ALERT'
            ],
            required: true,
            index: true,
        },
        severity: {
            type: String,
            enum: ['low', 'medium', 'high'],
            default: 'medium',
        },
        payload: {
            gameId:      { type: String, required: true },
            characterId: { type: String },
            title:       { type: String, required: true },
            description: { type: String, required: true },
            link:        { type: String },
            timestamp:   { type: String },
            data:        { type: Schema.Types.Mixed },
        },
        isRead: { type: Boolean, default: false, index: true },
    },
    { timestamps: true }
);

NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, isRead: 1 });

export default mongoose.model<INotification>('Notification', NotificationSchema);
