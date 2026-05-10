import { INotificationRepository } from '../repositories/NotificationRepository';
import { NotificationType, NotificationSeverity } from '../models/Notification';
import { BaseService } from './BaseService';
import mongoose from 'mongoose';
export declare class NotificationService extends BaseService {
    private readonly notificationRepository;
    private readonly emailService?;
    constructor(notificationRepository: INotificationRepository, emailService?: any);
    /**
     * Generic notification method
     */
    notify(userId: string | mongoose.Types.ObjectId, type: NotificationType, payload: {
        gameId: string;
        characterId?: string;
        title: string;
        description: string;
        link?: string;
        data?: any;
    }, severity?: NotificationSeverity): Promise<void>;
    /**
     * Special helper for RIVAL_WATCH alerts
     */
    rivalWatch(userId: string, data: {
        gameId: string;
        gameName: string;
        rivalName: string;
        analysisId: string;
    }): Promise<void>;
    /**
     * Special helper for PRO_SCOUT alerts
     */
    proScout(userId: string, data: {
        gameId: string;
        proName: string;
        analysisId: string;
        characterId?: string;
    }): Promise<void>;
    /**
     * Analysis complete notification
     */
    analysisComplete(userId: string, analysisId: string, youtubeUrl: string): Promise<void>;
    /**
     * Broadcase notification to all users
     */
    broadcast(type: NotificationType, payload: {
        gameId: string;
        characterId?: string;
        title: string;
        description: string;
        link?: string;
        data?: any;
    }, severity?: NotificationSeverity): Promise<void>;
    /**
     * Character theory notification
     */
    characterTheory(data: {
        userId?: string;
        gameId: string;
        characterId: string;
        title: string;
        description: string;
    }): Promise<void>;
    /**
     * Matchup theory notification
     */
    matchupTheory(data: {
        userId?: string;
        gameId: string;
        characterId: string;
        opponentId: string;
        title: string;
        description: string;
    }): Promise<void>;
    /**
     * Legacy/Generic push method used by worker
     */
    sendPushToUser(userId: string, title: string, body: string, data?: any): Promise<void>;
}
//# sourceMappingURL=NotificationService.d.ts.map