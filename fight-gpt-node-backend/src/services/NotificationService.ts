import { INotificationRepository } from '../repositories/NotificationRepository';
import { NotificationType } from '../models/Notification';
import mongoose from 'mongoose';

export class NotificationService {
    constructor(private readonly repo: INotificationRepository) {}

    // ─── Generic fire ────────────────────────────────────────────────────────
    async notify(
        userId: string | mongoose.Types.ObjectId,
        type: NotificationType,
        payload: { gameId: string; title: string; description: string; characterId?: string; link?: string; data?: any },
        severity: 'low' | 'medium' | 'high' = 'medium'
    ) {
        try {
            await this.repo.createNotification({ userId: new mongoose.Types.ObjectId(userId.toString()), type, severity, payload });
        } catch (e) {
            console.error('[NotificationService] Failed to create notification:', e);
        }
    }

    // ─── Broadcast to every user ─────────────────────────────────────────────
    async broadcast(
        type: NotificationType,
        payload: { gameId: string; title: string; description: string; characterId?: string; link?: string; data?: any },
        severity: 'low' | 'medium' | 'high' = 'medium'
    ) {
        try {
            await this.repo.broadcastToAllUsers({ type, severity, payload });
        } catch (e) {
            console.error('[NotificationService] Broadcast failed:', e);
        }
    }

    // ─── Typed helpers ───────────────────────────────────────────────────────

    async techDiscovery(opts: {
        gameId: string;
        scenarioId: string;
        eventType: string;
        description: string;
        context: string;
        characters: string[];
        youtubeUrl?: string;
    }) {
        const chars = opts.characters.length > 0
            ? opts.characters.map(c => c.toUpperCase()).join(' & ')
            : opts.gameId.toUpperCase();
        const shortDesc = opts.context?.length > 120
            ? opts.context.slice(0, 117) + '…'
            : (opts.context || opts.description);

        await this.broadcast('TECH_DISCOVERY', {
            gameId: opts.gameId,
            title: `[${chars}] New tech — ${opts.eventType.replace(/_/g, ' ')}`,
            description: shortDesc,
            characterId: opts.characters[0] || undefined,
            // Internal detail page — NOT raw YouTube
            link: `/dashboard/tech/${opts.scenarioId}`,
            data: { scenarioId: opts.scenarioId, youtubeUrl: opts.youtubeUrl },
        }, 'high');
    }

    async newCombo(opts: { gameId: string; characterName: string; combo: string; damage: number; link?: string }) {
        await this.broadcast('NEW_COMBO', {
            gameId: opts.gameId,
            title: `New combo discovered — ${opts.characterName}`,
            description: `${opts.combo} · ${opts.damage} damage`,
            characterId: opts.characterName,
            link: opts.link ?? '/dashboard/meta',
            data: opts,
        }, 'high');
    }

    async patchBrief(opts: { gameId: string; gameName: string; patchVersion: string; summary: string; link?: string }) {
        await this.broadcast('PATCH_BRIEF', {
            gameId: opts.gameId,
            title: `${opts.gameName} ${opts.patchVersion} patch brief ready`,
            description: opts.summary,
            link: opts.link ?? '/dashboard/meta',
            data: opts,
        }, 'high');
    }

    async metaShift(opts: { gameId: string; characterName: string; direction: 'up' | 'down'; winRateDelta: number }) {
        const arrow = opts.direction === 'up' ? '↑' : '↓';
        await this.broadcast('META_SHIFT', {
            gameId: opts.gameId,
            title: `Meta shift — ${opts.characterName} ${arrow}`,
            description: `Win rate moved ${opts.winRateDelta > 0 ? '+' : ''}${opts.winRateDelta.toFixed(1)}% this week`,
            characterId: opts.characterName,
            link: '/dashboard/meta',
            data: opts,
        }, 'medium');
    }

    async characterTheory(opts: { gameId: string; characterName: string; theoryId: string; headline: string }) {
        await this.broadcast('CHARACTER_THEORY', {
            gameId: opts.gameId,
            title: `New AI theory — ${opts.characterName}`,
            description: opts.headline,
            characterId: opts.characterName,
            link: `/dashboard/meta?theory=${opts.theoryId}`,
            data: opts,
        }, 'medium');
    }

    async matchupTheory(opts: { gameId: string; charA: string; charB: string; theoryId: string; headline: string }) {
        await this.broadcast('MATCHUP_THEORY', {
            gameId: opts.gameId,
            title: `Matchup theory updated — ${opts.charA} vs ${opts.charB}`,
            description: opts.headline,
            link: `/dashboard/meta?theory=${opts.theoryId}`,
            data: opts,
        }, 'medium');
    }

    async vectorInsight(opts: { gameId: string; characterName: string; insight: string; scenarioCount: number }) {
        await this.broadcast('VECTOR_INSIGHT', {
            gameId: opts.gameId,
            title: `AI pattern found — ${opts.characterName}`,
            description: `${opts.insight} (based on ${opts.scenarioCount} tournament scenarios)`,
            characterId: opts.characterName,
            link: '/dashboard/meta',
            data: opts,
        }, 'medium');
    }

    async tierListUpdate(opts: { gameId: string; gameName: string; changes: string }) {
        await this.broadcast('TIER_LIST_UPDATE', {
            gameId: opts.gameId,
            title: `${opts.gameName} tier list updated`,
            description: opts.changes,
            link: '/dashboard/meta',
            data: opts,
        }, 'low');
    }

    async analysisComplete(userId: string, opts: { gameId: string; analysisId: string; summary: string }) {
        await this.notify(userId, 'ANALYSIS_COMPLETE', {
            gameId: opts.gameId,
            title: 'Your match analysis is ready',
            description: opts.summary,
            link: `/dashboard/matches?id=${opts.analysisId}`,
            data: opts,
        }, 'high');
    }

    async rankUp(userId: string, opts: { gameId: string; newRank: string; xp: number }) {
        await this.notify(userId, 'RANK_UP', {
            gameId: opts.gameId,
            title: `Rank up — ${opts.newRank}`,
            description: `You earned ${opts.xp} XP and reached ${opts.newRank}`,
            link: '/dashboard',
            data: opts,
        }, 'high');
    }
}
