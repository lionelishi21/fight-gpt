import mongoose, { Document } from 'mongoose';
export type NotificationType = 'TECH_DISCOVERY' | 'META_SHIFT' | 'RIVAL_WATCH' | 'PRO_SCOUT' | 'NEW_COMBO' | 'PATCH_BRIEF' | 'CHARACTER_THEORY' | 'MATCHUP_THEORY' | 'ANALYSIS_COMPLETE' | 'RANK_UP' | 'VECTOR_INSIGHT' | 'TIER_LIST_UPDATE' | 'SYSTEM_ALERT';
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
declare const _default: mongoose.Model<INotification, {}, {}, {}, mongoose.Document<unknown, {}, INotification, {}, {}> & INotification & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Notification.d.ts.map