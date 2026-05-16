import { INotificationRepository } from '../repositories/NotificationRepository';
import { INotification, NotificationType, NotificationSeverity } from '../models/Notification';
import { BaseService } from './BaseService';
import mongoose from 'mongoose';

export class NotificationService extends BaseService {
    constructor(
        private readonly notificationRepository: INotificationRepository,
        private readonly emailService?: any
    ) {
        super();
    }

    /**
     * Returns true if user is on a paid tier (COMPETITOR or PRO).
     * Character-specific notifications are premium-only.
     */
    private async isPremiumUser(userId: string | mongoose.Types.ObjectId): Promise<boolean> {
        try {
            const User = (await import('../models/User')).default;
            const user = await User.findById(userId).select('tier role').lean();
            if (!user) return false;
            if ((user as any).role === 'admin') return true;
            const tier = ((user as any).tier || 'FREE').toUpperCase();
            return tier !== 'FREE';
        } catch {
            return false;
        }
    }

    /**
     * Generic notification method.
     * If payload includes a characterId, only premium users receive it.
     * General notifications (no characterId) go to all users.
     */
    async notify(
        userId: string | mongoose.Types.ObjectId,
        type: NotificationType,
        payload: {
            gameId: string;
            characterId?: string;
            title: string;
            description: string;
            link?: string;
            data?: any;
        },
        severity: NotificationSeverity = 'medium'
    ): Promise<void> {
        try {
            // Character-specific intel is a premium feature
            if (payload.characterId) {
                const premium = await this.isPremiumUser(userId);
                if (!premium) return;
            }

            await this.notificationRepository.createNotification({
                userId: typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) as any : userId as any,
                type,
                severity,
                payload,
                isRead: false
            });

            // Trigger Email if Service is available
            if (this.emailService) {
                try {
                    const User = (await import('../models/User')).default;
                    const user = await User.findById(userId).select('email').lean();
                    if (user && user.email) {
                        await this.emailService.sendNotificationEmail(
                            user.email,
                            payload.title,
                            payload.description,
                            payload.link
                        );
                    }
                } catch (e) {
                    console.error('[NotificationService] Email dispatch failed:', e);
                }
            }

            console.log(`[NotificationService] Notified user ${userId}: ${payload.title}`);
        } catch (error) {
            console.error('[NotificationService] Failed to create notification:', error);
        }
    }

    /**
     * Special helper for RIVAL_WATCH alerts
     */
    async rivalWatch(
        userId: string,
        data: {
            gameId: string;
            gameName: string;
            rivalName: string;
            analysisId: string;
        }
    ): Promise<void> {
        await this.notify(userId, 'RIVAL_WATCH', {
            gameId: data.gameId,
            title: `RIVAL SPOTTED: ${data.rivalName}`,
            description: `New match data detected for your rival ${data.rivalName} in ${data.gameName}.`,
            link: `/dashboard/matches/${data.analysisId}`,
            data: { analysisId: data.analysisId }
        }, 'high');

        // Trigger email alert if service is available
        if (this.emailService && typeof this.emailService.sendRivalWatchAlert === 'function') {
            try {
                const User = (await import('../models/User')).default;
                const user = await User.findById(userId).select('email name').lean();
                if (user && user.email) {
                    await this.emailService.sendRivalWatchAlert(
                        user.email,
                        user.name || 'Fighter',
                        data.rivalName,
                        data.gameName,
                        `${process.env.APP_URL || 'https://metapunish.com'}/dashboard/matches/${data.analysisId}`
                    );
                }
            } catch (e) {
                console.error('[NotificationService] Rival watch email failed:', e);
            }
        }
    }

    /**
     * Special helper for PRO_SCOUT alerts
     */
    async proScout(
        userId: string,
        data: {
            gameId: string;
            proName: string;
            analysisId: string;
            characterId?: string;
        }
    ): Promise<void> {
        await this.notify(userId, 'PRO_SCOUT', {
            gameId: data.gameId,
            characterId: data.characterId,
            title: `PRO DATA: ${data.proName} Active`,
            description: `${data.proName} was spotted in a new match. Analyze their character tech now.`,
            link: `/dashboard/matches/${data.analysisId}`,
            data: { analysisId: data.analysisId }
        }, 'medium');
    }

    /**
     * Analysis complete notification
     */
    async analysisComplete(userId: string, analysisId: string, youtubeUrl: string): Promise<void> {
        await this.notify(userId, 'ANALYSIS_COMPLETE', {
            gameId: 'unknown', // Will be updated by caller if known
            title: 'Analysis Ready',
            description: `Your analysis for ${youtubeUrl} is complete and ready for review.`,
            link: `/dashboard/matches/${analysisId}`,
            data: { analysisId }
        }, 'low');
    }
    /**
     * Broadcase notification to all users
     */
    async broadcast(
        type: NotificationType,
        payload: {
            gameId: string;
            characterId?: string;
            title: string;
            description: string;
            link?: string;
            data?: any;
        },
        severity: NotificationSeverity = 'medium'
    ): Promise<void> {
        try {
            if (payload.characterId) {
                // Character-specific broadcast: only premium users
                const User = (await import('../models/User')).default;
                const premiumUsers = await User.find({
                    $or: [{ tier: { $in: ['COMPETITOR', 'PRO'] } }, { role: 'admin' }]
                }).select('_id').lean();
                for (const u of premiumUsers) {
                    await this.notify(u._id.toString(), type, payload, severity);
                }
            } else {
                // General broadcast: all users
                await this.notificationRepository.broadcastToAllUsers({
                    type,
                    severity,
                    payload,
                    isRead: false
                });
            }
        } catch (error) {
            console.error('[NotificationService] Broadcast failed:', error);
        }
    }

    /**
     * System Alert notification (targets admins)
     */
    async systemAlert(title: string, description: string, data?: any): Promise<void> {
        try {
            const User = (await import('../models/User')).default;
            const admins = await User.find({ role: 'admin' }).select('_id').lean();
            
            const payload = {
                gameId: 'system',
                title,
                description,
                data
            };

            for (const admin of admins) {
                await this.notify(admin._id.toString(), 'SYSTEM_ALERT', payload, 'high');
            }
            console.log(`[NotificationService] Dispatched SYSTEM_ALERT to ${admins.length} admins.`);
        } catch (error) {
            console.error('[NotificationService] Failed to dispatch SYSTEM_ALERT:', error);
        }
    }

    /**
     * Character theory notification
     */
    async characterTheory(data: {
        userId?: string;
        gameId: string;
        characterId: string;
        title: string;
        description: string;
    }): Promise<void> {
        const payload = {
            gameId: data.gameId,
            characterId: data.characterId,
            title: data.title,
            description: data.description,
            link: `/dashboard/theory/${data.characterId}`
        };

        if (data.userId) {
            await this.notify(data.userId, 'CHARACTER_THEORY', payload);
        } else {
            await this.broadcast('CHARACTER_THEORY', payload);
        }
    }

    /**
     * Matchup theory notification
     */
    async matchupTheory(data: {
        userId?: string;
        gameId: string;
        characterId: string;
        opponentId: string;
        title: string;
        description: string;
    }): Promise<void> {
        const payload = {
            gameId: data.gameId,
            characterId: data.characterId,
            title: data.title,
            description: data.description,
            link: `/dashboard/theory/${data.characterId}/matchup/${data.opponentId}`,
            data: { opponentId: data.opponentId }
        };

        if (data.userId) {
            await this.notify(data.userId, 'MATCHUP_THEORY', payload);
        } else {
            await this.broadcast('MATCHUP_THEORY', payload);
        }
    }

    /**
     * Legacy/Generic push method used by worker
     */
    async sendPushToUser(userId: string, title: string, body: string, data?: any): Promise<void> {
        await this.notify(userId, 'ANALYSIS_COMPLETE', {
            gameId: data?.gameId || 'unknown',
            title,
            description: body,
            data
        });
    }
}
