"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const EmailService_1 = require("./EmailService");
const User_1 = __importDefault(require("../models/User"));
class NotificationService {
    repo;
    constructor(repo) {
        this.repo = repo;
    }
    // ─── Generic fire ────────────────────────────────────────────────────────
    async notify(userId, type, payload, severity = 'medium') {
        try {
            await this.repo.createNotification({ userId: new mongoose_1.default.Types.ObjectId(userId.toString()), type, severity, payload });
            // Trigger Mobile Push
            this.sendPushToUser(userId.toString(), payload.title, payload.description, payload.data).catch(err => {
                console.error('[NotificationService] Push delivery failed:', err);
            });
        }
        catch (e) {
            console.error('[NotificationService] Failed to create notification:', e);
        }
    }
    async sendPushToUser(userId, title, body, data) {
        try {
            const user = await User_1.default.findById(userId).select('pushTokens').lean().exec();
            if (!user || !user.pushTokens || user.pushTokens.length === 0)
                return;
            const { Expo } = await Promise.resolve().then(() => __importStar(require('expo-server-sdk')));
            const expo = new Expo();
            const messages = [];
            for (const token of user.pushTokens) {
                if (!Expo.isExpoPushToken(token)) {
                    console.error(`Push token ${token} is not a valid Expo push token`);
                    continue;
                }
                messages.push({
                    to: token,
                    sound: 'default',
                    title,
                    body,
                    data,
                });
            }
            if (messages.length > 0) {
                const chunks = expo.chunkPushNotifications(messages);
                for (const chunk of chunks) {
                    await expo.sendPushNotificationsAsync(chunk);
                }
            }
        }
        catch (err) {
            console.error('[NotificationService] sendPushToUser error:', err);
        }
    }
    // ─── Broadcast to every user ─────────────────────────────────────────────
    async broadcast(type, payload, severity = 'medium') {
        try {
            await this.repo.broadcastToAllUsers({ type, severity, payload });
            // Trigger Mobile Push Broadcast
            this.sendPushToAll(payload.title, payload.description, payload.data).catch(err => {
                console.error('[NotificationService] Broadcast push failed:', err);
            });
        }
        catch (e) {
            console.error('[NotificationService] Broadcast failed:', e);
        }
    }
    async sendPushToAll(title, body, data) {
        try {
            const users = await User_1.default.find({ pushTokens: { $exists: true, $not: { $size: 0 } } }).select('pushTokens').lean().exec();
            if (users.length === 0)
                return;
            const { Expo } = await Promise.resolve().then(() => __importStar(require('expo-server-sdk')));
            const expo = new Expo();
            const messages = [];
            for (const user of users) {
                for (const token of user.pushTokens) {
                    if (Expo.isExpoPushToken(token)) {
                        messages.push({ to: token, sound: 'default', title, body, data });
                    }
                }
            }
            if (messages.length > 0) {
                const chunks = expo.chunkPushNotifications(messages);
                for (const chunk of chunks) {
                    await expo.sendPushNotificationsAsync(chunk);
                }
            }
        }
        catch (err) {
            console.error('[NotificationService] sendPushToAll error:', err);
        }
    }
    // ─── Typed helpers ───────────────────────────────────────────────────────
    async techDiscovery(opts) {
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
    async newCombo(opts) {
        await this.broadcast('NEW_COMBO', {
            gameId: opts.gameId,
            title: `New combo discovered — ${opts.characterName}`,
            description: `${opts.combo} · ${opts.damage} damage`,
            characterId: opts.characterName,
            link: opts.link ?? '/dashboard/meta',
            data: opts,
        }, 'high');
    }
    async patchBrief(opts) {
        await this.broadcast('PATCH_BRIEF', {
            gameId: opts.gameId,
            title: `${opts.gameName} ${opts.patchVersion} patch brief ready`,
            description: opts.summary,
            link: opts.link ?? '/dashboard/meta',
            data: opts,
        }, 'high');
    }
    async metaShift(opts) {
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
    async characterTheory(opts) {
        const char = !opts.characterName || opts.characterName === 'undefined' || opts.characterName === 'null' || opts.characterName === 'Unknown' ? 'Unknown Operator' : opts.characterName;
        await this.broadcast('CHARACTER_THEORY', {
            gameId: opts.gameId,
            title: `New AI theory — ${char.toUpperCase()}`,
            description: opts.headline,
            characterId: opts.characterName,
            link: `/dashboard/meta?theory=${opts.theoryId}`,
            data: opts,
        }, 'medium');
    }
    async matchupTheory(opts) {
        await this.broadcast('MATCHUP_THEORY', {
            gameId: opts.gameId,
            title: `Matchup theory updated — ${opts.charA} vs ${opts.charB}`,
            description: opts.headline,
            link: `/dashboard/meta?theory=${opts.theoryId}`,
            data: opts,
        }, 'medium');
    }
    async vectorInsight(opts) {
        await this.broadcast('VECTOR_INSIGHT', {
            gameId: opts.gameId,
            title: `AI pattern found — ${opts.characterName}`,
            description: `${opts.insight} (based on ${opts.scenarioCount} tournament scenarios)`,
            characterId: opts.characterName,
            link: '/dashboard/meta',
            data: opts,
        }, 'medium');
    }
    async tierListUpdate(opts) {
        await this.broadcast('TIER_LIST_UPDATE', {
            gameId: opts.gameId,
            title: `${opts.gameName} tier list updated`,
            description: opts.changes,
            link: '/dashboard/meta',
            data: opts,
        }, 'low');
    }
    async analysisComplete(userId, opts) {
        await this.notify(userId, 'ANALYSIS_COMPLETE', {
            gameId: opts.gameId,
            title: 'Your match analysis is ready',
            description: opts.summary,
            link: `/dashboard/matches?id=${opts.analysisId}`,
            data: opts,
        }, 'high');
    }
    async rankUp(userId, opts) {
        await this.notify(userId, 'RANK_UP', {
            gameId: opts.gameId,
            title: `Rank up — ${opts.newRank}`,
            description: `You earned ${opts.xp} XP and reached ${opts.newRank}`,
            link: '/dashboard',
            data: opts,
        }, 'high');
    }
    async rivalWatch(userId, opts) {
        // 1. Create in-app notification
        await this.notify(userId, 'RIVAL_WATCH', {
            gameId: opts.gameId,
            title: `RIVAL SPOTTED: ${opts.rivalName}`,
            description: `Your tracked rival ${opts.rivalName} was found in a new match.`,
            link: opts.youtubeUrl,
            data: { rivalName: opts.rivalName, analysisId: opts.analysisId }
        }, 'high');
        // 2. Send email alert
        try {
            const user = await User_1.default.findById(userId).select('email name').lean().exec();
            if (user && user.email) {
                const analysisUrl = `https://metapunish.com/dashboard/matches?id=${opts.analysisId}`;
                await EmailService_1.emailService.sendRivalWatchAlert(user.email, user.name, opts.rivalName, opts.gameName, analysisUrl);
            }
        }
        catch (err) {
            console.error('[NotificationService] Failed to send rival watch email:', err);
        }
    }
}
exports.NotificationService = NotificationService;
//# sourceMappingURL=NotificationService.js.map