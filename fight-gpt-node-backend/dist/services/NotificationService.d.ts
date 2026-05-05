import { INotificationRepository } from '../repositories/NotificationRepository';
import { NotificationType } from '../models/Notification';
import mongoose from 'mongoose';
export declare class NotificationService {
    private readonly repo;
    constructor(repo: INotificationRepository);
    notify(userId: string | mongoose.Types.ObjectId, type: NotificationType, payload: {
        gameId: string;
        title: string;
        description: string;
        characterId?: string;
        link?: string;
        data?: any;
    }, severity?: 'low' | 'medium' | 'high'): Promise<void>;
    sendPushToUser(userId: string, title: string, body: string, data?: any): Promise<void>;
    broadcast(type: NotificationType, payload: {
        gameId: string;
        title: string;
        description: string;
        characterId?: string;
        link?: string;
        data?: any;
    }, severity?: 'low' | 'medium' | 'high'): Promise<void>;
    private sendPushToAll;
    techDiscovery(opts: {
        gameId: string;
        scenarioId: string;
        eventType: string;
        description: string;
        context: string;
        characters: string[];
        youtubeUrl?: string;
    }): Promise<void>;
    newCombo(opts: {
        gameId: string;
        characterName: string;
        combo: string;
        damage: number;
        link?: string;
    }): Promise<void>;
    patchBrief(opts: {
        gameId: string;
        gameName: string;
        patchVersion: string;
        summary: string;
        link?: string;
    }): Promise<void>;
    metaShift(opts: {
        gameId: string;
        characterName: string;
        direction: 'up' | 'down';
        winRateDelta: number;
    }): Promise<void>;
    characterTheory(opts: {
        gameId: string;
        characterName: string;
        theoryId: string;
        headline: string;
    }): Promise<void>;
    matchupTheory(opts: {
        gameId: string;
        charA: string;
        charB: string;
        theoryId: string;
        headline: string;
    }): Promise<void>;
    vectorInsight(opts: {
        gameId: string;
        characterName: string;
        insight: string;
        scenarioCount: number;
    }): Promise<void>;
    tierListUpdate(opts: {
        gameId: string;
        gameName: string;
        changes: string;
    }): Promise<void>;
    analysisComplete(userId: string, opts: {
        gameId: string;
        analysisId: string;
        summary: string;
    }): Promise<void>;
    rankUp(userId: string, opts: {
        gameId: string;
        newRank: string;
        xp: number;
    }): Promise<void>;
    rivalWatch(userId: string, opts: {
        gameId: string;
        gameName: string;
        rivalName: string;
        analysisId: string;
        youtubeUrl?: string;
    }): Promise<void>;
    proScout(userId: string, opts: {
        gameId: string;
        proName: string;
        analysisId: string;
        characterId?: string;
    }): Promise<void>;
}
//# sourceMappingURL=NotificationService.d.ts.map